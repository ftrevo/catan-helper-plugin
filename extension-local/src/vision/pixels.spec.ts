import { describe, expect, test } from 'vitest'
import { type RgbaImage, cropAndResize, cropImage, rgbaToRgb } from './pixels'

/** 3x2 image where every pixel encodes its own coordinates: R = x, G = y, B = 200, A = 255. */
const image: RgbaImage = {
  width: 3,
  height: 2,
  data: new Uint8ClampedArray(Array.from({ length: 6 }, (_, i) => [i % 3, Math.floor(i / 3), 200, 255]).flat()),
}

describe('cropImage', () => {
  test('copies the requested rectangle row by row', () => {
    const crop = cropImage(image, { x: 1, y: 0, width: 2, height: 2 })
    expect(crop.width).toBe(2)
    expect(crop.height).toBe(2)
    expect([...crop.data]).toEqual([1, 0, 200, 255, 2, 0, 200, 255, 1, 1, 200, 255, 2, 1, 200, 255])
  })

  test('refuses rectangles outside the image', () => {
    expect(() => cropImage(image, { x: 2, y: 0, width: 2, height: 1 })).toThrow(RangeError)
    expect(() => cropImage(image, { x: -1, y: 0, width: 1, height: 1 })).toThrow(RangeError)
  })
})

describe('rgbaToRgb', () => {
  test('drops the alpha channel and keeps pixel order', () => {
    expect([...rgbaToRgb(cropImage(image, { x: 0, y: 1, width: 2, height: 1 }))]).toEqual([0, 1, 200, 1, 1, 200])
  })
})

describe('cropAndResize', () => {
  test('is an exact copy for an aligned, same-size rectangle', () => {
    const plain = cropImage(image, { x: 1, y: 0, width: 2, height: 2 })
    const resized = cropAndResize(image, { x: 1, y: 0, width: 2, height: 2 }, { width: 2, height: 2 })
    expect([...resized.data]).toEqual([...plain.data])
  })

  test('interpolates when shrinking', () => {
    // Two horizontally adjacent pixels with R = 0 and R = 2 average to 1.
    const shrunk = cropAndResize(image, { x: 0, y: 0, width: 3, height: 1 }, { width: 1, height: 1 })
    expect(shrunk.width).toBe(1)
    expect(shrunk.data[0]).toBe(1)
    expect(shrunk.data[3]).toBe(255)
  })

  test('refuses rectangles outside the image', () => {
    expect(() => cropAndResize(image, { x: 2.5, y: 0, width: 1, height: 1 }, { width: 1, height: 1 })).toThrow(
      RangeError
    )
  })
})
