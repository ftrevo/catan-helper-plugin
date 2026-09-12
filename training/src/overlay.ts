/**
 * Draws vertex and edge ids over a capture so pieces can be labelled by hand for the fixtures.
 *   node --import tsx src/overlay.ts capture.png out.png [scale]
 */
import { createCanvas, loadImage } from '@napi-rs/canvas'
import sharp from 'sharp'
import { locateBoard } from '../../extension-local/src/vision/boardLocator.ts'
import { edgeCenters, vertexCenters } from '../../extension-local/src/vision/layout.ts'

const [, , input, output, scaleArg] = process.argv
if (!input || !output) throw new Error('usage: overlay <capture.png> <out.png> [scale]')
const scale = Number(scaleArg ?? 1)

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const image = {
  width: info.width,
  height: info.height,
  data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
}
const geometry = locateBoard(image)
const img = await loadImage(await sharp(input).png().toBuffer())
const canvas = createCanvas(Math.round(info.width * scale), Math.round(info.height * scale))
const ctx = canvas.getContext('2d')
ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
const label = (x: number, y: number, text: string, fill: string) => {
  ctx.font = `bold ${Math.max(10, geometry.spacing * scale * 0.11)}px sans-serif`
  const w = ctx.measureText(text).width + 6
  const h = geometry.spacing * scale * 0.13
  ctx.fillStyle = fill
  ctx.fillRect(x * scale - w / 2, y * scale - h / 2, w, h)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x * scale, y * scale)
}
edgeCenters(geometry).forEach((c, i) => label(c.x, c.y, `e${i}`, 'rgba(120,0,160,0.85)'))
vertexCenters(geometry).forEach((c, i) => label(c.x, c.y, `${i}`, 'rgba(0,0,0,0.85)'))
await sharp(canvas.toBuffer('image/png')).toFile(output)
console.log(`wrote ${output} (spacing ${geometry.spacing.toFixed(1)})`)
