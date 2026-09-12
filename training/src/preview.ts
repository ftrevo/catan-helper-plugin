/**
 * Visual calibration aid: renders one synthetic board at the reference spacing and writes
 *  - out/preview-board.png: the whole synthetic board
 *  - out/preview-crops.png: synthetic resource/number crops (top rows) above the same crops taken
 *    from the real fixture screenshot (bottom rows), so drawing scale and offsets can be compared.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { ImageData, createCanvas } from '@napi-rs/canvas'
import sharp from 'sharp'
import { REFERENCE_SPACING } from '../../extension-local/src/vision/layout.ts'
import { type RgbaImage } from '../../extension-local/src/vision/pixels.ts'
import { Atlas } from './atlas.ts'
import { cropTiles } from './dataset.ts'
import { FIXTURES_DIR, OUT_DIR } from './paths.ts'
import { Random } from './random.ts'
import { loadTileSprites, renderBoard } from './renderer.ts'
import { locateBoard } from '../../extension-local/src/vision/boardLocator.ts'

const toPng = async (image: RgbaImage): Promise<Buffer> =>
  sharp(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength), {
    raw: { width: image.width, height: image.height, channels: 4 },
  })
    .png()
    .toBuffer()

const loadPng = async (path: string): Promise<RgbaImage> => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return {
    width: info.width,
    height: info.height,
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
  }
}

const contactSheet = (rows: RgbaImage[][], cell: { width: number; height: number }): RgbaImage => {
  const gap = 4
  const columns = Math.max(...rows.map((r) => r.length))
  const canvas = createCanvas(columns * (cell.width + gap), rows.length * (cell.height + gap))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#222'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  rows.forEach((row, r) =>
    row.forEach((img, c) => {
      const tile = createCanvas(img.width, img.height)
      tile.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0)
      ctx.drawImage(tile, c * (cell.width + gap), r * (cell.height + gap))
    })
  )
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { width: canvas.width, height: canvas.height, data }
}

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })
  const atlas = await Atlas.load()
  const tileSprites = await loadTileSprites()
  const board = renderBoard(atlas, tileSprites, new Random(7), { spacing: REFERENCE_SPACING, highlightProbability: 1 })
  await writeFile(`${OUT_DIR}/preview-board.png`, await toPng(board.image))

  const synthetic = cropTiles(board.image, board, 0)
  const fixture = await loadPng(`${FIXTURES_DIR}/colonist-board.png`)
  const real = cropTiles(fixture, locateBoard(fixture), 0)

  const sheet = contactSheet([synthetic.resources, real.resources, synthetic.numbers, real.numbers], {
    width: 80,
    height: 70,
  })
  await writeFile(`${OUT_DIR}/preview-crops.png`, await toPng(sheet))
  console.log(`wrote ${OUT_DIR}/preview-board.png and preview-crops.png`)
  console.log('synthetic tiles:', board.tiles.map((t) => `${t.resource}:${t.number}`).join(' '))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
