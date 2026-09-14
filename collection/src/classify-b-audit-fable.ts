/**
 * Contact-sheet renderer for the v3 audit (audit-crops-fable). Reads manifests written by the audit's own
 * Python sampler and draws labelled crops; it does not sample or decide anything itself. Read-only with
 * respect to examples/games.
 *
 *   node --import tsx src/classify-b-audit-fable.ts sheets <manifest-dir> <out-dir>
 *
 * Piece manifests: [{game, capture, pos: 'v8'|'e5'|'t3', a, b, b2?, score?, seats?, note?, span?}]
 * Board manifests: [{game, capture, note?, overlays?, coveredTiles?, robber?, merchant?}]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { edgeCenters, tileCenters, vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { TRAINING_DIR } from './paths.ts'
import { GAMES_DIR } from './registry.ts'

const { createCanvas, loadImage } = createRequire(resolve(TRAINING_DIR, 'src/atlas.ts'))(
  '@napi-rs/canvas'
) as typeof import('@napi-rs/canvas')

type PieceItem = {
  game: string
  capture: string
  pos: string
  a?: string
  b?: string
  b2?: string
  score?: number | null
  seats?: string | null
  note?: string
  span?: number
}
type BoardItem = {
  game: string
  capture: string
  note?: string
  overlays?: { x: number; y: number; width: number; height: number }[]
  rejected?: { x: number; y: number; width: number; height: number }[]
  coveredTiles?: number[]
  robber?: number | null
  merchant?: number | null
  mark?: string[]
}

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
const pointOf = (geometry: { center: { x: number; y: number }; spacing: number }, pos: string) => {
  const n = Number(pos.slice(1))
  return pos[0] === 'v' ? vertexCenters(geometry)[n]! : pos[0] === 'e' ? edgeCenters(geometry)[n]! : tileCenters(geometry)[n]!
}

const CELL = 240
const CAP = 70
const COLS = 4

const pieceSheet = async (items: PieceItem[], out: string) => {
  const rows = Math.ceil(items.length / COLS)
  const canvas = createCanvas(COLS * CELL, rows * (CELL + CAP))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (const [i, s] of items.entries()) {
    const png = findPng(s.game, s.capture)
    if (!png) continue
    const geometry = readGeometry(s.game, s.capture)
    const image = await loadImage(png)
    const point = pointOf(geometry, s.pos)
    const span = s.span ?? (s.pos[0] === 'v' ? 1.0 : s.pos[0] === 'e' ? 0.9 : 0.8)
    const side = Math.round(geometry.spacing * span)
    const cx = (i % COLS) * CELL
    const cy = Math.floor(i / COLS) * (CELL + CAP)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(image, Math.round(point.x - side / 2), Math.round(point.y - side / 2), side, side, cx, cy, CELL, CELL)
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
    ctx.font = '11px sans-serif'
    ctx.fillStyle = '#ffd27f'
    ctx.fillText(`A:  ${s.a ?? ''}`.slice(0, 40), cx + 4, cy + CELL + 26)
    ctx.fillStyle = '#9fd9ff'
    ctx.fillText(`B3: ${s.b ?? ''}${s.score !== undefined && s.score !== null ? ` ${s.score}` : ''}`.slice(0, 40), cx + 4, cy + CELL + 39)
    ctx.fillStyle = '#c9a0ff'
    ctx.fillText(`B2: ${s.b2 ?? '-'}`.slice(0, 40), cx + 4, cy + CELL + 52)
    ctx.fillStyle = '#aaa'
    ctx.font = '10px sans-serif'
    ctx.fillText(`${s.note ?? `seats: ${s.seats ?? '?'}`}`.slice(0, 46), cx + 4, cy + CELL + 65)
  }
  writeFileSync(out, canvas.toBuffer('image/png'))
}

const boardSheet = async (items: BoardItem[], out: string, width = 520) => {
  const cols = Math.min(3, items.length)
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
    const sx = g.center.x - 3.0 * g.spacing
    const sy = g.center.y - 2.7 * g.spacing
    const sw = 6.0 * g.spacing
    const sh = sw * 0.82
    const cx = (i % cols) * width
    const cy = Math.floor(i / cols) * cellH
    const k = width / sw
    ctx.drawImage(image, sx, sy, sw, sh, cx, cy, width, Math.round(sh * k))
    const tiles = tileCenters(g)
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,40,40,0.9)'
    for (const o of it.overlays ?? []) ctx.strokeRect(cx + (o.x - sx) * k, cy + (o.y - sy) * k, o.width * k, o.height * k)
    ctx.strokeStyle = 'rgba(255,160,40,0.9)'
    ctx.setLineDash([4, 3])
    for (const o of it.rejected ?? []) ctx.strokeRect(cx + (o.x - sx) * k, cy + (o.y - sy) * k, o.width * k, o.height * k)
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(255,120,255,0.9)'
    for (const t of it.coveredTiles ?? []) {
      const c = tiles[t]!
      ctx.beginPath()
      ctx.arc(cx + (c.x - sx) * k, cy + (c.y - sy) * k, 0.12 * g.spacing * k, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (it.robber !== undefined && it.robber !== null) {
      const c = tiles[it.robber]!
      ctx.strokeStyle = 'rgba(255,255,0,0.95)'
      ctx.beginPath()
      ctx.arc(cx + (c.x - 0.3 * g.spacing - sx) * k, cy + (c.y - 0.26 * g.spacing - sy) * k, 0.24 * g.spacing * k, 0, Math.PI * 2)
      ctx.stroke()
    }
    if (it.merchant !== undefined && it.merchant !== null) {
      const c = tiles[it.merchant]!
      ctx.strokeStyle = 'rgba(0,255,255,0.95)'
      ctx.beginPath()
      ctx.arc(cx + (c.x + 0.25 * g.spacing - sx) * k, cy + (c.y - 0.28 * g.spacing - sy) * k, 0.16 * g.spacing * k, 0, Math.PI * 2)
      ctx.stroke()
    }
    // Marked positions (e.g. the pieces a seat inference rests on): small green circles with the label.
    ctx.strokeStyle = 'rgba(80,255,80,0.95)'
    ctx.fillStyle = 'rgba(80,255,80,0.95)'
    ctx.font = 'bold 10px sans-serif'
    for (const m of it.mark ?? []) {
      const [pos, label] = m.split(':')
      const p = pointOf(g, pos!)
      ctx.beginPath()
      ctx.arc(cx + (p.x - sx) * k, cy + (p.y - sy) * k, 0.1 * g.spacing * k, 0, Math.PI * 2)
      ctx.stroke()
      if (label) ctx.fillText(label, cx + (p.x - sx) * k + 6, cy + (p.y - sy) * k - 6)
    }
    ctx.fillStyle = '#111'
    ctx.fillRect(cx, cy + cellH - 30, width, 30)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`#${i + 1} ${it.game}/${it.capture}`, cx + 4, cy + cellH - 17)
    ctx.fillStyle = '#ccc'
    ctx.font = '11px sans-serif'
    ctx.fillText((it.note ?? '').slice(0, 90), cx + 4, cy + cellH - 4)
  }
  writeFileSync(out, canvas.toBuffer('image/png'))
}

const [mode, manifestDir, outDir = manifestDir] = process.argv.slice(2)
if (mode === 'sheets' && manifestDir) {
  mkdirSync(outDir!, { recursive: true })
  for (const f of readdirSync(manifestDir).filter((f) => f.endsWith('.json')).sort()) {
    const items = JSON.parse(readFileSync(resolve(manifestDir, f), 'utf8')) as (PieceItem | BoardItem)[]
    if (!items.length) continue
    const out = resolve(outDir!, f.replace(/\.json$/, '.png'))
    if ('pos' in items[0]!) await pieceSheet(items as PieceItem[], out)
    else await boardSheet(items as BoardItem[], out, f.includes("zoom") ? 1000 : 520)
    console.log(out)
  }
} else console.error('usage: sheets <manifest-dir> [out-dir]')
