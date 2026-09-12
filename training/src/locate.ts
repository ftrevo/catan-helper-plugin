/**
 * Runs the extension's board locator on screenshots and prints the geometry it finds. Handy to check a
 * new capture before turning it into a fixture or cutting tile sprites from it.
 *
 *   node --import tsx src/locate.ts capture.png [more.png ...]
 *   node --import tsx src/locate.ts --resize 4800 huge-capture.png out.png   # downscale first (very large renders)
 */
import sharp from 'sharp'
import { locateBoard } from '../../extension-local/src/vision/boardLocator.ts'
import { type RgbaImage } from '../../extension-local/src/vision/pixels.ts'

const args = process.argv.slice(2)

const load = async (path: string, width?: number): Promise<RgbaImage> => {
  const pipeline = width ? sharp(path).resize({ width }) : sharp(path)
  const { data, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return {
    width: info.width,
    height: info.height,
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
  }
}

const report = (name: string, image: RgbaImage) => {
  try {
    const l = locateBoard(image)
    console.log(
      `${name}: ${image.width}x${image.height} spacing ${l.spacing.toFixed(1)} center (${l.center.x.toFixed(0)}, ${l.center.y.toFixed(0)}) tokens ${l.tokensFound}`
    )
  } catch (error) {
    console.log(`${name}: ${image.width}x${image.height} FAILED ${(error as Error).message}`)
  }
}

if (args[0] === '--resize') {
  const [, width, input, output] = args
  if (!width || !input || !output) throw new Error('usage: --resize <width> <input.png> <output.png>')
  const image = await load(input, Number(width))
  await sharp(Buffer.from(image.data.buffer), { raw: { width: image.width, height: image.height, channels: 4 } })
    .png()
    .toFile(output)
  report(output, image)
} else {
  for (const path of args) report(path.split('/').pop() ?? path, await load(path))
}
