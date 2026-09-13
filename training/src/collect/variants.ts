/**
 * Counts the piece variants the readings do not distinguish: metropolis type (science, politics, trade)
 * and knight level and state, per player colour, by matching the atlas sprites at the detected pieces.
 *
 *   node --import tsx src/collect/variants.ts [colour ...]
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { vertexCenters } from '../../../extension-local/src/vision/layout.ts'
import { Atlas, drawSprite } from '../atlas.ts'
import { GAMES_DIR } from './registry.ts'

const atlas = await Atlas.load()
const only = process.argv.slice(2)
const TILE_SOURCE_WIDTH = 416
const PIECE_SCALE = 1.2
const PIECE_ANCHOR_DY = -0.065
const KNIGHT_DIAMETER = 0.35

type Reading = {
  ok: boolean
  location?: { center: { x: number; y: number }; spacing: number }
  pieces?: { buildings: { vertex: number; kind: string; colour: string }[] }
}

const render = (name: string, scale: number) => {
  const s = atlas.get(name)
  const size = Math.ceil(Math.max(s.sourceSize.w, s.sourceSize.h) * scale) + 2
  const c = createCanvas(size, size)
  const ctx = c.getContext('2d')
  drawSprite(ctx, s, size / 2, size / 2, scale)
  return { size, data: ctx.getImageData(0, 0, size, size).data }
}

/** Mean colour of the tower body, for classifying a metropolis by its commodity. */
const towerColours = ['science', 'politics', 'trade'].map((type) => {
  const t = render(`metropolis_${type}`, 0.3)
  let r = 0,
    g = 0,
    b = 0,
    n = 0
  for (let i = 0; i < t.data.length; i += 4) {
    if (t.data[i + 3]! < 250) continue
    const lum = (t.data[i]! + t.data[i + 1]! + t.data[i + 2]!) / 3
    if (lum < 60) continue // outlines and windows
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

const matchScore = (img: { width: number; height: number; data: Uint8ClampedArray }, t: ReturnType<typeof render>, cx: number, cy: number) => {
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

const counts: Record<string, Record<string, number>> = {}
const bump = (colour: string, key: string) => ((counts[colour] ??= {})[key] = ((counts[colour] ??= {})[key] ?? 0) + 1)

let captures = 0
for (const game of readdirSync(GAMES_DIR).sort()) {
  const dir = resolve(GAMES_DIR, game)
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.reading.json'))) {
    const reading = JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as Reading
    if (!reading.ok || !reading.location || !reading.pieces) continue
    const pieces = reading.pieces.buildings.filter(
      (b) => (b.kind === 'metropolis' || b.kind === 'knight') && (only.length === 0 || only.includes(b.colour))
    )
    if (pieces.length === 0) continue
    const png = resolve(dir, file.replace(/\.reading\.json$/, '.png'))
    if (!existsSync(png)) continue
    captures++
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
        // Sample the upper tower body, right of the city.
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
          bump(piece.colour, 'metropolis ?')
          continue
        }
        r /= n
        g /= n
        b /= n
        const best = towerColours.reduce((a, c) =>
          Math.hypot(c.r - r, c.g - g, c.b - b) < Math.hypot(a.r - r, a.g - g, a.b - b) ? c : a
        )
        bump(piece.colour, `metropolis ${best.type}`)
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
        bump(piece.colour, best.score < 60 ? best.name : 'knight (no close match)')
      }
    }
  }
}

console.log(`scanned ${captures} captures`)
for (const [colour, keys] of Object.entries(counts).sort()) {
  console.log(colour)
  for (const [key, n] of Object.entries(keys).sort()) console.log(`  ${key.padEnd(28)} ${n}`)
}
