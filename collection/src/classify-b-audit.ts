/**
 * Audit helper for classification B: draws seeded random samples per flag class from the *.b.json files
 * and renders labelled contact sheets so a human can judge A vs B on fresh pieces (not the report's own
 * picks). Read-only with respect to examples/games.
 *
 *   node --import tsx src/classify-b-audit.ts sample <out-dir> [--seed 7] [--n 12]
 *   node --import tsx src/classify-b-audit.ts sheets <out-dir>            # renders every manifest in out-dir
 *   node --import tsx src/classify-b-audit.ts boards <out-dir> <name> <game>/<capture>...   # board thumbnails
 *
 * Sheets: <out-dir>/<class>.png (4 x 3 cells, each a crop with A / B labels) and <class>.json (the sample).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { edgeCenters, tileCenters, vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { EXAMPLES_DIR, TRAINING_DIR } from './paths.ts'
import { GAMES_DIR } from './registry.ts'

const { createCanvas, loadImage } = createRequire(resolve(TRAINING_DIR, 'src/atlas.ts'))(
  '@napi-rs/canvas'
) as typeof import('@napi-rs/canvas')

const B_DIR = resolve(EXAMPLES_DIR, 'classification-v2')

type Piece = {
  vertex?: number
  edge?: number
  A: { kind: string; colour: string | null }
  B: {
    kind: string
    colour: string | null
    colourSeatConstrained: string | null
    type?: string
    level?: number
    state?: string
    levelWithAColour?: number
    stateWithAColour?: string
    scores: { best: number | null; runnerUp: number | null; margin: number | null; seatBest: number | null }
  }
  flags: string[]
}
type Capture = {
  game: string
  capture: string
  skipped?: string
  geometry: { center: { x: number; y: number }; spacing: number }
  seats: { colours: string[]; inferred: boolean } | null
  robberDetection: { tile: number | null; score: number | null; runnerUpScore: number | null }
  merchantDetection: { tile: number | null; colour: string | null; score: number | null }
  overlaySuspected: boolean
  overlayRules: string[]
  overlays: { x: number; y: number; width: number; height: number }[]
  coveredTiles: number[]
  pieces: Piece[]
}

const loadCaptures = (): Capture[] => {
  const out: Capture[] = []
  for (const game of readdirSync(B_DIR).sort()) {
    const dir = resolve(B_DIR, game)
    if (!/^\d{8}-/.test(game) || !statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.b.json')).sort()) {
      const c = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as Capture
      if (!c.skipped) out.push(c)
    }
  }
  return out
}

const rng = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const sampleN = <T>(xs: T[], n: number, rand: () => number): T[] => {
  const a = xs.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a.slice(0, n)
}

const variantA = (p: Piece) =>
  p.A.kind === 'none'
    ? 'nothing'
    : p.A.kind === 'metropolis'
      ? `metropolis-${p.B.type ?? '?'}`
      : p.A.kind === 'knight'
        ? p.B.levelWithAColour
          ? `knight-L${p.B.levelWithAColour}-${p.B.stateWithAColour}`
          : 'knight-?'
        : p.A.kind
const variantB = (p: Piece) =>
  p.B.kind === 'metropolis'
    ? `metropolis-${p.B.type ?? '?'}`
    : p.B.kind === 'knight'
      ? `knight-L${p.B.level}-${p.B.state}`
      : p.B.kind
export const labelA = (p: Piece) => `${p.A.colour ?? 'none'}-${variantA(p)}`
export const labelB = (p: Piece) => `${p.B.colour ?? 'none'}-${variantB(p)}`

type Sample = {
  game: string
  capture: string
  pos: string
  a: string
  b: string
  bSeat: string | null
  score: number | null
  margin: number | null
  seats: string | null
  flags: string[]
}
const toSample = (c: Capture, p: Piece): Sample => ({
  game: c.game,
  capture: c.capture,
  pos: p.vertex !== undefined ? `v${p.vertex}` : `e${p.edge}`,
  a: labelA(p),
  b: labelB(p),
  bSeat: p.B.colourSeatConstrained,
  score: p.B.scores.best,
  margin: p.B.scores.margin,
  seats: c.seats ? `${c.seats.colours.join(',')}${c.seats.inferred ? ' (inferred)' : ''}` : null,
  flags: p.flags,
})

/* ------------------------------------------------------------------------------------ report's rules */
const seatSource = (c: Capture) => (c.seats ? (c.seats.inferred ? 'inferred' : 'registry') : 'none')
const isRelabel = (c: Capture, p: Piece) => {
  const score = p.B.scores.best ?? 99
  if (p.flags.includes('missed-by-a')) return false
  if (p.flags.includes('phantom-colour')) {
    if (seatSource(c) === 'inferred' && p.A.colour !== null && p.B.colour === p.A.colour && score < 20) return false
    return score < 20 && p.B.colour !== p.A.colour
  }
  return p.flags.includes('colour-mismatch') && score < 20
}
const isDrop = (c: Capture, p: Piece) => {
  const score = p.B.scores.best ?? 99
  if (p.flags.includes('missed-by-a') || !p.flags.includes('phantom-colour')) return false
  if (seatSource(c) === 'inferred' && p.A.colour !== null && p.B.colour === p.A.colour && score < 20) return false
  return !(score < 20 && p.B.colour !== p.A.colour) && score >= 45
}

const CLASSES: { name: string; match: (p: Piece, c: Capture) => boolean; n?: number; stratify?: boolean }[] = [
  {
    name: 'colour-mismatch-seat-genuine',
    match: (p) => p.flags.includes('colour-mismatch-seat') && !p.flags.includes('phantom-colour'),
  },
  { name: 'phantom-colour', match: (p) => p.flags.includes('phantom-colour') && p.A.kind !== 'none' },
  { name: 'kind-mismatch', match: (p) => p.flags.includes('kind-mismatch') },
  { name: 'missed-by-a', match: (p) => p.flags.includes('missed-by-a') },
  { name: 'relabel-candidates', match: (p, c) => isRelabel(c, p) },
  { name: 'drop-candidates', match: (p, c) => isDrop(c, p) },
  { name: 'agree', match: (p) => p.A.kind !== 'none' && p.flags.length === 0, n: 24, stratify: true },
  { name: 'colour-mismatch-only', match: (p) => p.flags.includes('colour-mismatch') && !p.flags.includes('phantom-colour') },
]

const sample = (outDir: string, seed: number, n: number) => {
  mkdirSync(outDir, { recursive: true })
  const captures = loadCaptures()
  const summary: Record<string, { population: number; sampled: number }> = {}
  for (const cls of CLASSES) {
    const rand = rng(seed + cls.name.length)
    const hits: { c: Capture; p: Piece }[] = []
    for (const c of captures) for (const p of c.pieces) if (cls.match(p, c)) hits.push({ c, p })
    let picked: { c: Capture; p: Piece }[]
    if (cls.stratify) {
      // Agreement is dominated by roads; take a fixed mix so every kind is looked at.
      const quota: Record<string, number> = { road: 8, settlement: 6, city: 4, knight: 4, metropolis: 2 }
      picked = []
      for (const [kind, q] of Object.entries(quota))
        picked.push(...sampleN(hits.filter((h) => h.p.A.kind === kind), q, rand))
    } else picked = sampleN(hits, cls.n ?? n, rand)
    picked.sort((x, y) => `${x.c.game}/${x.c.capture}`.localeCompare(`${y.c.game}/${y.c.capture}`))
    summary[cls.name] = { population: hits.length, sampled: picked.length }
    writeFileSync(resolve(outDir, `${cls.name}.json`), JSON.stringify(picked.map(({ c, p }) => toSample(c, p)), null, 1))
  }
  // Capture-level samples: overlay-flagged and not, and robber checks.
  const rand = rng(seed + 99)
  const flagged = sampleN(captures.filter((c) => c.overlaySuspected), n, rand)
  const clean = sampleN(captures.filter((c) => !c.overlaySuspected), n, rand)
  const robber = sampleN(captures.filter((c) => c.robberDetection.tile !== null), 10, rand)
  const capInfo = (c: Capture) => ({
    game: c.game,
    capture: c.capture,
    overlaySuspected: c.overlaySuspected,
    overlayRules: c.overlayRules,
    robber: c.robberDetection,
    merchant: c.merchantDetection,
  })
  writeFileSync(resolve(outDir, 'overlay-flagged.json'), JSON.stringify(flagged.map(capInfo), null, 1))
  writeFileSync(resolve(outDir, 'overlay-clean.json'), JSON.stringify(clean.map(capInfo), null, 1))
  writeFileSync(resolve(outDir, 'robber.json'), JSON.stringify(robber.map(capInfo), null, 1))
  summary['overlay-flagged'] = { population: captures.filter((c) => c.overlaySuspected).length, sampled: flagged.length }
  summary['overlay-clean'] = { population: captures.length - summary['overlay-flagged'].population, sampled: clean.length }
  summary['robber'] = { population: captures.filter((c) => c.robberDetection.tile !== null).length, sampled: robber.length }
  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify({ seed, summary }, null, 1))
  console.log(JSON.stringify(summary, null, 1))
}

/* ------------------------------------------------------------------------------------------- drawing */
const findPng = (game: string, capture: string) => {
  const dir = resolve(GAMES_DIR, game)
  if (!existsSync(dir)) return null
  const f = readdirSync(dir).find((f) => f.startsWith(capture) && f.endsWith('.png'))
  return f ? resolve(dir, f) : null
}
const readGeometry = (game: string, capture: string) => {
  const dir = resolve(GAMES_DIR, game)
  const f = readdirSync(dir).find((f) => f.startsWith(capture) && f.endsWith('.reading.json'))!
  const r = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) as {
    location: { center: { x: number; y: number }; spacing: number }
  }
  return r.location
}

const CELL = 230
const CAP = 54
const COLS = 4

const pieceSheet = async (samples: Sample[], out: string) => {
  const rows = Math.ceil(samples.length / COLS)
  const canvas = createCanvas(COLS * CELL, rows * (CELL + CAP))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (const [i, s] of samples.entries()) {
    const png = findPng(s.game, s.capture)
    if (!png) continue
    const geometry = readGeometry(s.game, s.capture)
    const image = await loadImage(png)
    const n = Number(s.pos.slice(1))
    const point = s.pos[0] === 'v' ? vertexCenters(geometry)[n]! : edgeCenters(geometry)[n]!
    // A little wider than the report's crops so neighbouring UI is visible too.
    const span = s.pos[0] === 'v' ? 1.0 : 0.9
    const side = Math.round(geometry.spacing * span)
    const cx = (i % COLS) * CELL
    const cy = Math.floor(i / COLS) * (CELL + CAP)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(image, Math.round(point.x - side / 2), Math.round(point.y - side / 2), side, side, cx, cy, CELL, CELL)
    // Cross-hair at the nominal position so the reader can see where the templates were anchored.
    ctx.strokeStyle = 'rgba(255,255,0,0.7)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx + CELL / 2 - 8, cy + CELL / 2)
    ctx.lineTo(cx + CELL / 2 + 8, cy + CELL / 2)
    ctx.moveTo(cx + CELL / 2, cy + CELL / 2 - 8)
    ctx.lineTo(cx + CELL / 2, cy + CELL / 2 + 8)
    ctx.stroke()
    ctx.fillStyle = '#111'
    ctx.fillRect(cx, cy + CELL, CELL, CAP)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`#${i + 1} ${s.pos}  ${s.game.replace(/^\d{8}-/, '')}/${s.capture.slice(0, 2)}`, cx + 4, cy + CELL + 13)
    ctx.font = '12px sans-serif'
    ctx.fillStyle = '#ffd27f'
    ctx.fillText(`A: ${s.a}`, cx + 4, cy + CELL + 27)
    ctx.fillStyle = '#9fd9ff'
    ctx.fillText(`B: ${s.b} ${s.score ?? ''}${s.bSeat && s.bSeat !== s.b.split('-')[0] ? ` seat:${s.bSeat}` : ''}`, cx + 4, cy + CELL + 40)
    ctx.fillStyle = '#aaa'
    ctx.font = '10px sans-serif'
    ctx.fillText(`seats: ${s.seats ?? '?'}`.slice(0, 44), cx + 4, cy + CELL + 51)
  }
  writeFileSync(out, canvas.toBuffer('image/png'))
}

/** Whole-board thumbnails with B's overlay rectangles (red), robber tile (yellow) and merchant tile (cyan). */
export const boardSheet = async (
  items: { game: string; capture: string; note?: string }[],
  out: string,
  bInfo: Map<string, Capture>,
  width = 420
) => {
  const cols = Math.min(4, items.length)
  const rows = Math.ceil(items.length / cols)
  const cellH = Math.round(width * 0.82) + 30
  const canvas = createCanvas(cols * width, rows * cellH)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (const [i, it] of items.entries()) {
    const png = findPng(it.game, it.capture)
    if (!png) continue
    const g = readGeometry(it.game, it.capture)
    const image = await loadImage(png)
    const b = bInfo.get(`${it.game}/${it.capture}`)
    const sx = g.center.x - 3.0 * g.spacing
    const sy = g.center.y - 2.7 * g.spacing
    const sw = 6.0 * g.spacing
    const sh = sw * 0.82
    const cx = (i % cols) * width
    const cy = Math.floor(i / cols) * cellH
    const k = width / sw
    ctx.drawImage(image, sx, sy, sw, sh, cx, cy, width, Math.round(sh * k))
    const tiles = tileCenters(g)
    if (b) {
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(255,40,40,0.9)'
      for (const o of b.overlays) ctx.strokeRect(cx + (o.x - sx) * k, cy + (o.y - sy) * k, o.width * k, o.height * k)
      ctx.strokeStyle = 'rgba(255,120,255,0.9)'
      for (const t of b.coveredTiles) {
        const c = tiles[t]!
        ctx.beginPath()
        ctx.arc(cx + (c.x - sx) * k, cy + (c.y - sy) * k, 0.12 * g.spacing * k, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (b.robberDetection.tile !== null) {
        const c = tiles[b.robberDetection.tile]!
        ctx.strokeStyle = 'rgba(255,255,0,0.95)'
        ctx.beginPath()
        ctx.arc(cx + (c.x - 0.3 * g.spacing - sx) * k, cy + (c.y - 0.26 * g.spacing - sy) * k, 0.24 * g.spacing * k, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (b.merchantDetection.tile !== null) {
        const c = tiles[b.merchantDetection.tile]!
        ctx.strokeStyle = 'rgba(0,255,255,0.95)'
        ctx.beginPath()
        ctx.arc(cx + (c.x + 0.25 * g.spacing - sx) * k, cy + (c.y - 0.28 * g.spacing - sy) * k, 0.16 * g.spacing * k, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
    ctx.fillStyle = '#111'
    ctx.fillRect(cx, cy + cellH - 30, width, 30)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`#${i + 1} ${it.game}/${it.capture}`, cx + 4, cy + cellH - 17)
    ctx.fillStyle = '#ccc'
    ctx.font = '11px sans-serif'
    const note =
      it.note ??
      (b
        ? `overlay=${b.overlaySuspected} [${b.overlayRules.join('; ')}] robber=t${b.robberDetection.tile} merchant=t${b.merchantDetection.tile}`
        : '')
    ctx.fillText(note.slice(0, 70), cx + 4, cy + cellH - 4)
  }
  writeFileSync(out, canvas.toBuffer('image/png'))
}

/* ----------------------------------------------------------------------------------------------- cli */
const [mode, outDir = 'audit-crops', ...rest] = process.argv.slice(2)
const argOf = (name: string, dflt: string) => {
  const i = rest.indexOf(name)
  return i >= 0 ? rest[i + 1]! : dflt
}
if (mode === 'sample') sample(outDir, Number(argOf('--seed', '7')), Number(argOf('--n', '12')))
else if (mode === 'sheets') {
  const captures = loadCaptures()
  const byKey = new Map(captures.map((c) => [`${c.game}/${c.capture}`, c]))
  for (const f of readdirSync(outDir).filter((f) => f.endsWith('.json') && f !== 'summary.json')) {
    const name = f.replace(/\.json$/, '')
    const items = JSON.parse(readFileSync(resolve(outDir, f), 'utf8')) as (Sample & { overlaySuspected?: boolean })[]
    if (!items.length) continue
    const out = resolve(outDir, `${name}.png`)
    if ('pos' in items[0]!) await pieceSheet(items, out)
    else await boardSheet(items, out, byKey, name === 'robber' ? 520 : 420)
    console.log(out)
  }
} else if (mode === 'boards') {
  const [name, ...caps] = rest
  const captures = loadCaptures()
  const byKey = new Map(captures.map((c) => [`${c.game}/${c.capture}`, c]))
  mkdirSync(outDir, { recursive: true })
  const items = caps.map((s) => {
    const [game, capture] = s.split('/') as [string, string]
    return { game, capture }
  })
  await boardSheet(items, resolve(outDir, `${name}.png`), byKey, 520)
  console.log(resolve(outDir, `${name}.png`))
} else console.error('usage: sample|sheets|boards <out-dir> ...')
