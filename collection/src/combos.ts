/**
 * Writes, for every stored capture, the SET of distinct asset types (colour + variant) it contains, so
 * captures can be grouped by the combination of pieces on the board. Same derivation as src/variants.ts:
 * settlements, cities and roads come from the reading; metropolis type and knight level/state are
 * classified by matching the atlas sprites against the PNG.
 *
 *   node --import tsx src/combos.ts --out <file.jsonl> [--shard i/n] [--list <file>]
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { Atlas, drawSprite } from '../../training/src/atlas.ts'
import { REPO_DIR, TRAINING_DIR } from './paths.ts'
import { EXAMPLES_DIR, GAMES_DIR } from './registry.ts'

const { createCanvas, loadImage } = createRequire(resolve(TRAINING_DIR, 'src/atlas.ts'))(
  '@napi-rs/canvas'
) as typeof import('@napi-rs/canvas')

const atlas = await Atlas.load()
const args = process.argv.slice(2)
const arg = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const out = arg('--out') ?? resolve(process.cwd(), 'combos.jsonl')
const shardArg = arg('--shard')
const [shardIndex = 0, shardCount = 1] = shardArg ? shardArg.split('/').map(Number) : [0, 1]

const TILE_SOURCE_WIDTH = 416
const PIECE_SCALE = 1.2
const PIECE_ANCHOR_DY = -0.065
const KNIGHT_DIAMETER = 0.35

type Reading = {
  ok: boolean
  location?: { center: { x: number; y: number }; spacing: number }
  pieces?: { buildings: { vertex: number; kind: string; colour: string }[]; roads?: { colour: string }[] }
}

const render = (name: string, scale: number) => {
  const s = atlas.get(name)
  const size = Math.ceil(Math.max(s.sourceSize.w, s.sourceSize.h) * scale) + 2
  const c = createCanvas(size, size)
  const ctx = c.getContext('2d')
  drawSprite(ctx, s, size / 2, size / 2, scale)
  return { size, data: ctx.getImageData(0, 0, size, size).data }
}

const towerColours = ['science', 'politics', 'trade'].map((type) => {
  const t = render(`metropolis_${type}`, 0.3)
  let r = 0,
    g = 0,
    b = 0,
    n = 0
  for (let i = 0; i < t.data.length; i += 4) {
    if (t.data[i + 3]! < 250) continue
    const lum = (t.data[i]! + t.data[i + 1]! + t.data[i + 2]!) / 3
    if (lum < 60) continue
    r += t.data[i]!
    g += t.data[i + 1]!
    b += t.data[i + 2]!
    n++
  }
  return { type, r: r / n, g: g / n, b: b / n }
})

const templateCache = new Map<string, ReturnType<typeof render>>()
const template = (name: string, scale: number) => {
  const key = `${name}@${scale.toFixed(3)}`
  let t = templateCache.get(key)
  if (!t) templateCache.set(key, (t = render(name, scale)))
  return t
}

const matchScore = (
  img: { width: number; height: number; data: Uint8ClampedArray },
  t: ReturnType<typeof render>,
  cx: number,
  cy: number
) => {
  let err = 0,
    n = 0
  for (let y = 0; y < t.size; y++)
    for (let x = 0; x < t.size; x++) {
      const o = (y * t.size + x) * 4
      if (t.data[o + 3]! < 200) continue
      const ix = Math.round(cx - t.size / 2 + x),
        iy = Math.round(cy - t.size / 2 + y)
      if (ix < 0 || iy < 0 || ix >= img.width || iy >= img.height) return Infinity
      const io = (iy * img.width + ix) * 4
      err +=
        Math.abs(img.data[io]! - t.data[o]!) +
        Math.abs(img.data[io + 1]! - t.data[o + 1]!) +
        Math.abs(img.data[io + 2]! - t.data[o + 2]!)
      n++
    }
  return err / n
}

const KEPT_DIR = resolve(EXAMPLES_DIR, 'kept')
const CORNER_DIR = resolve(KEPT_DIR, 'corner-cases')
/** Captures live under examples/games and, once curated, under examples/kept and examples/kept/corner-cases/<case>. */
const ROOTS = [
  GAMES_DIR,
  KEPT_DIR,
  ...(existsSync(CORNER_DIR) ? readdirSync(CORNER_DIR).map((c) => resolve(CORNER_DIR, c)) : []),
].filter((root) => existsSync(root))

/** A fixed list of "<game>/<file>.reading.json" lines keeps every shard on the same capture set while the collection worker keeps writing. */
const list = arg('--list')
const captures: { game: string; file: string }[] = []
if (list) {
  for (const line of readFileSync(list, 'utf8').split('\n').filter(Boolean)) {
    const [game, file] = line.split('/')
    captures.push({ game: game!, file: file! })
  }
} else {
  for (const root of ROOTS)
    for (const game of readdirSync(root).sort()) {
      const dir = resolve(root, game)
      if (!statSync(dir).isDirectory()) continue // examples/kept also holds map.json and map.md
      for (const file of readdirSync(dir)
        .filter((f) => f.endsWith('.reading.json'))
        .sort())
        captures.push({ game, file })
    }
}

const lines: string[] = []
let done = 0
for (const [i, capture] of captures.entries()) {
  if (i % shardCount !== shardIndex) continue
  const { game, file } = capture
  const dir =
    ROOTS.map((root) => resolve(root, game)).find((d) => existsSync(resolve(d, file))) ?? resolve(GAMES_DIR, game)
  const rel = `${relative(REPO_DIR, dir)}/${file.replace(/\.reading\.json$/, '.png')}`
  let reading: Reading
  try {
    reading = JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as Reading
  } catch {
    lines.push(JSON.stringify({ file: rel, game, status: 'unreadable-json' }))
    continue
  }
  if (!reading.ok || !reading.location || !reading.pieces) {
    lines.push(JSON.stringify({ file: rel, game, status: 'reading-not-ok' }))
    continue
  }
  const counts: Record<string, number> = {}
  /** Per-piece rows (vertex/edge, colour, variant) so downstream tools can reason about board geometry. */
  const spots: { vertex?: number; edge?: number; colour: string; variant: string }[] = []
  const types = { add: (k: string) => void (counts[k] = (counts[k] ?? 0) + 1) }
  const at = (vertex: number, colour: string, variant: string) => {
    types.add(`${colour} ${variant}`)
    spots.push({ vertex, colour, variant })
  }
  for (const b of reading.pieces.buildings)
    if (b.kind === 'settlement' || b.kind === 'city') at(b.vertex, b.colour, b.kind)
  for (const r of reading.pieces.roads ?? []) {
    types.add(`${r.colour} road`)
    spots.push({ edge: (r as { edge?: number }).edge, colour: r.colour, variant: 'road' })
  }

  const matchScores: { vertex: number; colour: string; score: number }[] = []
  const pieces = reading.pieces.buildings.filter((b) => b.kind === 'metropolis' || b.kind === 'knight')
  const png = resolve(dir, file.replace(/\.reading\.json$/, '.png'))
  if (pieces.length > 0 && existsSync(png)) {
    const image = await loadImage(png)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const img = ctx.getImageData(0, 0, image.width, image.height)
    const { spacing } = reading.location
    const vertices = vertexCenters(reading.location)
    const pieceScale = (spacing / TILE_SOURCE_WIDTH) * PIECE_SCALE

    for (const piece of pieces) {
      const v = vertices[piece.vertex]!
      if (piece.kind === 'metropolis') {
        const cx = v.x + 0.28 * 154 * pieceScale
        const cy = v.y + PIECE_ANCHOR_DY * spacing - 20 * pieceScale
        let r = 0,
          g = 0,
          b = 0,
          n = 0
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) {
            const o = (Math.round(cy + dy) * img.width + Math.round(cx + dx)) * 4
            const lum = (img.data[o]! + img.data[o + 1]! + img.data[o + 2]!) / 3
            if (lum < 60) continue
            r += img.data[o]!
            g += img.data[o + 1]!
            b += img.data[o + 2]!
            n++
          }
        if (n === 0) {
          at(piece.vertex, piece.colour, 'metropolis ?')
          continue
        }
        r /= n
        g /= n
        b /= n
        const best = towerColours.reduce((a, c) =>
          Math.hypot(c.r - r, c.g - g, c.b - b) < Math.hypot(a.r - r, a.g - g, a.b - b) ? c : a
        )
        at(piece.vertex, piece.colour, `metropolis ${best.type}`)
      } else {
        const knightScale = (KNIGHT_DIAMETER * spacing) / 240
        let best = { name: '?', score: Infinity }
        for (const level of [1, 2, 3])
          for (const state of ['active', 'inactive']) {
            const name = `knight_level${level}_${state}_${piece.colour}`
            if (!atlas.has(name)) continue
            const t = template(name, knightScale)
            for (let dy = -3; dy <= 3; dy += 1)
              for (let dx = -3; dx <= 3; dx += 1) {
                const score = matchScore(img, t, v.x + dx, v.y + dy)
                if (score < best.score) best = { name: `knight level ${level} ${state}`, score }
              }
          }
        at(piece.vertex, piece.colour, best.score < 60 ? best.name : 'knight (no close match)')
        matchScores.push({ vertex: piece.vertex, colour: piece.colour, score: Math.round(best.score * 10) / 10 })
      }
    }
  } else if (pieces.length > 0) {
    lines.push(
      JSON.stringify({ file: rel, game, status: 'png-missing', types: Object.keys(counts).sort(), counts, spots })
    )
    continue
  }
  lines.push(
    JSON.stringify({ file: rel, game, status: 'ok', types: Object.keys(counts).sort(), counts, spots, matchScores })
  )
  if (++done % 25 === 0) console.error(`shard ${shardIndex}: ${done} captures`)
}

writeFileSync(out, lines.join('\n') + '\n')
console.error(`shard ${shardIndex}: wrote ${lines.length} rows to ${out}`)
