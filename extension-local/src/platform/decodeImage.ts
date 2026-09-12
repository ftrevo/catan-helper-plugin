import { type RgbaImage } from '../vision/pixels'

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, payload] = dataUrl.split(',', 2)
  if (!header || payload === undefined || !header.startsWith('data:')) {
    throw new Error('Expected a data URL')
  }

  const mimeType = header.slice('data:'.length).split(';')[0] || 'application/octet-stream'
  const binary = atob(payload)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new Blob([bytes], { type: mimeType })
}

const bitmapToRgba = (bitmap: ImageBitmap): RgbaImage => {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('2D canvas context is not available')

  context.drawImage(bitmap, 0, 0)
  const { width, height, data } = context.getImageData(0, 0, bitmap.width, bitmap.height)

  return { width, height, data }
}

const decodeBlob = async (blob: Blob): Promise<RgbaImage> => {
  // No colour or alpha processing: the models were trained on the raw PNG pixel values.
  const bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
  try {
    return bitmapToRgba(bitmap)
  } finally {
    bitmap.close()
  }
}

/** Decodes a PNG/JPEG data URL (as returned by `chrome.tabs.captureVisibleTab`) into raw pixels. */
export const decodeDataUrl = (dataUrl: string): Promise<RgbaImage> => decodeBlob(dataUrlToBlob(dataUrl))

/** Fetches and decodes an image by URL. Used by the dev server to run the pipeline on a fixture. */
export const decodeImageUrl = async (url: string): Promise<RgbaImage> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`)
  return decodeBlob(await response.blob())
}
