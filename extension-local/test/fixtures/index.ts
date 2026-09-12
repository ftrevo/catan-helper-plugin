import { readFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import { type RgbaImage } from '../../src/vision/pixels'

export { SAMPLE_BOARD } from './sample-board'
export { SAMPLE_BOARD_2 } from './sample-board-2'

export const FIXTURE_SCREENSHOTS = {
  /** Original sample the backend was built against. Tile spacing 216 px. */
  board1: 'test/fixtures/colonist-board.png',
  /** Live bots game, smaller board. Tile spacing about 193 px. */
  board2: 'test/fixtures/colonist-board-2.png',
} as const

export const loadPng = async (path: string): Promise<RgbaImage> => {
  const png = PNG.sync.read(await readFile(path))
  return { width: png.width, height: png.height, data: new Uint8ClampedArray(png.data) }
}
