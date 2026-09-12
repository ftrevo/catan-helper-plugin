/** Debug aid: renders boards and writes a contact sheet of vertex patches grouped by kind label. */
import { ImageData, createCanvas } from '@napi-rs/canvas'
import sharp from 'sharp'
import { BUILDING_KIND_LABELS } from '../../extension-local/src/vision/labels.ts'
import { Atlas } from './atlas.ts'
import { cropPiecePatches } from './dataset.ts'
import { OUT_DIR } from './paths.ts'
import { Random } from './random.ts'
import { loadTileSprites, renderBoard } from './renderer.ts'

const atlas = await Atlas.load()
const sprites = await loadTileSprites()
const random = new Random(3)
const perKind = new Map<number, { img: { width: number; height: number; data: Uint8ClampedArray }; colour: number }[]>()
for (let b = 0; b < 12; b++) {
  const spacing = Math.exp(random.range(Math.log(80), Math.log(220)))
  const board = renderBoard(atlas, sprites, random, { spacing, pieceDensity: 0.35, roadDensity: 0.3 })
  const { buildings } = cropPiecePatches(board.image, board, board.pieces, 0.015, random)
  buildings.images.forEach((img, i) => {
    const kind = buildings.kinds[i] as number
    const list = perKind.get(kind) ?? []
    if (list.length < 14) list.push({ img, colour: buildings.colours[i] as number })
    perKind.set(kind, list)
  })
}
const cell = 44
const canvas = createCanvas(14 * cell + 120, BUILDING_KIND_LABELS.length * cell)
const ctx = canvas.getContext('2d')
ctx.fillStyle = '#222'
ctx.fillRect(0, 0, canvas.width, canvas.height)
ctx.fillStyle = '#fff'
ctx.font = '13px sans-serif'
BUILDING_KIND_LABELS.forEach((label, k) => {
  ctx.fillText(label, 4, k * cell + 26)
  ;(perKind.get(k) ?? []).forEach(({ img }, i) => {
    const tile = createCanvas(img.width, img.height)
    tile.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0)
    ctx.drawImage(tile, 120 + i * cell, k * cell + 2, 40, 40)
  })
})
await sharp(canvas.toBuffer('image/png')).toFile(`${OUT_DIR}/patches-by-kind.png`)
console.log([...perKind].map(([k, v]) => `${BUILDING_KIND_LABELS[k]}: ${v.length}`).join(', '))
