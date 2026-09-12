import { readFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import { type RgbaImage } from '../src/vision/pixels'

export const loadPng = async (path: string): Promise<RgbaImage> => {
  const png = PNG.sync.read(await readFile(path))
  return { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) }
}
