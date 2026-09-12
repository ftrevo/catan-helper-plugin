/**
 * Turns rendered boards into model inputs using exactly the crop geometry the extension applies at
 * runtime (imported from the extension source), so training and inference never drift apart.
 */
import {
  type BoardGeometry,
  NUMBER_CROP,
  RESOURCE_CROP,
  cropRect,
  tileCenters,
} from '../../extension-local/src/vision/layout.ts'
import { type RgbaImage, cropAndResize, rectFitsIn } from '../../extension-local/src/vision/pixels.ts'
import { type Random } from './random.ts'

export type TileCrops = { resources: RgbaImage[]; numbers: RgbaImage[] }

/**
 * Crops all 19 tiles. `jitter` shifts every crop centre by up to that fraction of the spacing to
 * imitate the locator's small errors; pass 0 for exact crops.
 */
export const cropTiles = (image: RgbaImage, geometry: BoardGeometry, jitter: number, random?: Random): TileCrops => {
  const centers = tileCenters(geometry)
  const shifted = centers.map((c) => ({
    x: c.x + (random ? random.range(-jitter, jitter) : 0) * geometry.spacing,
    y: c.y + (random ? random.range(-jitter, jitter) : 0) * geometry.spacing,
  }))

  const crop = (spec: typeof RESOURCE_CROP) =>
    shifted.map((c) => {
      const rect = cropRect(c, spec, geometry.spacing)
      if (!rectFitsIn(rect, image)) throw new Error(`Crop leaves the image at (${rect.x}, ${rect.y})`)
      return cropAndResize(image, rect, spec.size)
    })

  return { resources: crop(RESOURCE_CROP), numbers: crop(NUMBER_CROP) }
}
