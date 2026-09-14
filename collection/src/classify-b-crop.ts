/**
 * Cuts small crops around board positions so a human can check a classification decision.
 *
 *   node --import tsx src/classify-b-crop.ts <game>/<capture> v8 v25 e31 --out <dir> [--zoom 4] [--tag a-vs-b]
 *
 * Crops are written as <dir>/<game>__<capture>__<pos>__<tag>.png.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { edgeCenters, tileCenters, vertexCenters } from '../../extension-local/src/vision/layout.ts'
import { TRAINING_DIR } from './paths.ts'
import { GAMES_DIR } from './registry.ts'

const { createCanvas, loadImage } = createRequire(resolve(TRAINING_DIR, 'src/atlas.ts'))(
  '@napi-rs/canvas'
) as typeof import('@napi-rs/canvas')

export type Geometry = { center: { x: number; y: number }; spacing: number }

/** Writes one crop centred on a board position; `span` is in spacings. */
export const writeCrop = async (
  png: string,
  geometry: Geometry,
  pos: { vertex?: number; edge?: number; tile?: number },
  out: string,
  span = 0.9,
  zoom = 4
): Promise<boolean> => {
  if (!existsSync(png)) return false
  const image = await loadImage(png)
  const point =
    pos.vertex !== undefined
      ? vertexCenters(geometry)[pos.vertex]
      : pos.edge !== undefined
        ? edgeCenters(geometry)[pos.edge]
        : tileCenters(geometry)[pos.tile ?? 0]
  if (!point) return false
  const side = Math.round(geometry.spacing * span)
  const x = Math.round(point.x - side / 2)
  const y = Math.round(point.y - side / 2)
  const canvas = createCanvas(side * zoom, side * zoom)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(image, x, y, side, side, 0, 0, side * zoom, side * zoom)
  mkdirSync(resolve(out, '..'), { recursive: true })
  writeFileSync(out, canvas.toBuffer('image/png'))
  return true
}

if (!process.env.CLASSIFY_B_LIB && process.argv[2] && !process.argv[2].startsWith('--')) {
  const args = process.argv.slice(2)
  const arg = (n: string) => {
    const i = args.indexOf(n)
    return i >= 0 ? args[i + 1] : undefined
  }
  const [game, capture] = args[0]!.split('/')
  const dir = resolve(GAMES_DIR, game!)
  const { readFileSync, readdirSync } = await import('node:fs')
  const readingFile = readdirSync(dir).find((f) => f.startsWith(capture!) && f.endsWith('.reading.json'))
  if (!readingFile) throw new Error(`no reading for ${args[0]}`)
  const reading = JSON.parse(readFileSync(resolve(dir, readingFile), 'utf8')) as { location: Geometry }
  const png = resolve(dir, readingFile.replace(/\.reading\.json$/, '.png'))
  const out = arg('--out') ?? resolve(process.cwd(), 'crops')
  const zoom = Number(arg('--zoom') ?? 4)
  const span = Number(arg('--span') ?? 0.9)
  const tag = arg('--tag') ?? 'crop'
  for (const spec of args.slice(1).filter((a) => /^[vet]\d+$/.test(a))) {
    const n = Number(spec.slice(1))
    const pos = spec[0] === 'v' ? { vertex: n } : spec[0] === 'e' ? { edge: n } : { tile: n }
    const file = resolve(out, `${game}__${capture}__${spec}__${tag}.png`)
    await writeCrop(png, reading.location, pos, file, span, zoom)
    console.log(file)
  }
}
