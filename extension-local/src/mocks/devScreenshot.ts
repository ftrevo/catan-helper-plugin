import { decodeImageUrl } from '../platform/decodeImage'
import { type RgbaImage } from '../vision/pixels'

/**
 * Stand-in for the Chrome capture when running `npm run dev` in a normal browser tab: loads the sample
 * board screenshot from the test fixtures so the real recognition pipeline can be exercised.
 */
export const captureFixtureScreenshot = (): Promise<RgbaImage> =>
  decodeImageUrl(new URL('/test/fixtures/colonist-board-3-1920x1080.png', document.baseURI).href)
