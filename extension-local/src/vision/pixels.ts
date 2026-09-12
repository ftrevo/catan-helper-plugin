/**
 * Minimal, environment-independent raster types. Everything downstream (cropping, tensors) works on
 * these plain structures so the same code runs in the popup, in Node tests and in a worker.
 */

/** 8-bit RGBA pixels, row-major, exactly like `ImageData`. */
export type RgbaImage = {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray
}

export type Point = { readonly x: number; readonly y: number }

export type Size = { readonly width: number; readonly height: number }

/** A rectangle in image coordinates. Fractional values are allowed where resampling is involved. */
export type Rect = Size & Point

const BYTES_PER_PIXEL = 4

export const rectFitsIn = (rect: Rect, size: Size): boolean =>
  rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= size.width && rect.y + rect.height <= size.height

/** Copies the pixels inside an integer `rect` into a new image. Throws if the rectangle leaves the source. */
export const cropImage = (image: RgbaImage, rect: Rect): RgbaImage => {
  if (!rectFitsIn(rect, image)) {
    throw new RangeError(
      `Crop ${rect.width}x${rect.height} at (${rect.x}, ${rect.y}) does not fit in a ${image.width}x${image.height} image`
    )
  }

  const data = new Uint8ClampedArray(rect.width * rect.height * BYTES_PER_PIXEL)
  const rowBytes = rect.width * BYTES_PER_PIXEL

  for (let row = 0; row < rect.height; row++) {
    const sourceStart = ((rect.y + row) * image.width + rect.x) * BYTES_PER_PIXEL
    data.set(image.data.subarray(sourceStart, sourceStart + rowBytes), row * rowBytes)
  }

  return { width: rect.width, height: rect.height, data }
}

/**
 * Samples `rect` (which may be fractional and of any size) into an image of exactly `target` pixels using
 * bilinear interpolation. When `rect` is integer-aligned and already `target`-sized this is an exact copy.
 */
export const cropAndResize = (image: RgbaImage, rect: Rect, target: Size): RgbaImage => {
  if (!rectFitsIn(rect, image)) {
    throw new RangeError(
      `Crop ${rect.width}x${rect.height} at (${rect.x}, ${rect.y}) does not fit in a ${image.width}x${image.height} image`
    )
  }

  const data = new Uint8ClampedArray(target.width * target.height * BYTES_PER_PIXEL)
  const scaleX = rect.width / target.width
  const scaleY = rect.height / target.height
  const maxX = image.width - 1
  const maxY = image.height - 1

  for (let ty = 0; ty < target.height; ty++) {
    const sy = Math.min(Math.max(rect.y + (ty + 0.5) * scaleY - 0.5, 0), maxY)
    const y0 = Math.floor(sy)
    const y1 = Math.min(y0 + 1, maxY)
    const wy = sy - y0

    for (let tx = 0; tx < target.width; tx++) {
      const sx = Math.min(Math.max(rect.x + (tx + 0.5) * scaleX - 0.5, 0), maxX)
      const x0 = Math.floor(sx)
      const x1 = Math.min(x0 + 1, maxX)
      const wx = sx - x0

      const p00 = (y0 * image.width + x0) * BYTES_PER_PIXEL
      const p01 = (y0 * image.width + x1) * BYTES_PER_PIXEL
      const p10 = (y1 * image.width + x0) * BYTES_PER_PIXEL
      const p11 = (y1 * image.width + x1) * BYTES_PER_PIXEL
      const out = (ty * target.width + tx) * BYTES_PER_PIXEL

      for (let c = 0; c < BYTES_PER_PIXEL; c++) {
        const top = (image.data[p00 + c] ?? 0) * (1 - wx) + (image.data[p01 + c] ?? 0) * wx
        const bottom = (image.data[p10 + c] ?? 0) * (1 - wx) + (image.data[p11 + c] ?? 0) * wx
        data[out + c] = top * (1 - wy) + bottom * wy
      }
    }
  }

  return { width: target.width, height: target.height, data }
}

/** Drops the alpha channel, producing the `[height, width, 3]` layout the models were trained on. */
export const rgbaToRgb = (image: RgbaImage): Uint8Array => {
  const pixelCount = image.width * image.height
  const rgb = new Uint8Array(pixelCount * 3)

  for (let i = 0; i < pixelCount; i++) {
    rgb[i * 3] = image.data[i * 4] ?? 0
    rgb[i * 3 + 1] = image.data[i * 4 + 1] ?? 0
    rgb[i * 3 + 2] = image.data[i * 4 + 2] ?? 0
  }

  return rgb
}
