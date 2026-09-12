/**
 * Scores a pair of models on the real fixture screenshots using the extension's own locator and crop
 * geometry, so the number reported here is what the popup would get.
 */
import * as tf from '@tensorflow/tfjs-node'
import sharp from 'sharp'
import { HEX_NUMBERS, RESOURCES } from '../../extension-local/src/domain/board.ts'
import { locateBoard } from '../../extension-local/src/vision/boardLocator.ts'
import { type RgbaImage, rgbaToRgb } from '../../extension-local/src/vision/pixels.ts'
import { FIXTURES } from '../../extension-local/test/fixtures/index.ts'
import { cropTiles } from './dataset.ts'
import { EXTENSION_DIR } from './paths.ts'

export const loadPng = async (path: string): Promise<RgbaImage> => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return {
    width: info.width,
    height: info.height,
    data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
  }
}

export const toBatch = (tiles: readonly RgbaImage[]): tf.Tensor4D => {
  const first = tiles[0]
  if (!first) throw new Error('empty batch')
  const bytes = first.width * first.height * 3
  const data = new Uint8Array(tiles.length * bytes)
  tiles.forEach((t, i) => data.set(rgbaToRgb(t), i * bytes))
  return tf.tensor4d(data, [tiles.length, first.height, first.width, 3], 'int32').toFloat().div(255) as tf.Tensor4D
}

const predictLabels = <L extends string>(model: tf.LayersModel, tiles: readonly RgbaImage[], labels: readonly L[]) =>
  tf.tidy(() => {
    const scores = model.predict(toBatch(tiles)) as tf.Tensor2D
    const indices = scores.argMax(1).dataSync()
    const confidences = scores.max(1).dataSync()
    return Array.from(indices, (index, i) => ({ label: labels[index] as L, confidence: confidences[i] ?? 0 }))
  })

export type Evaluation = {
  fixture: string
  resourceHits: number
  numberHits: number
  meanConfidence: number
  mistakes: string[]
}

export const evaluateModels = async (resources: tf.LayersModel, numbers: tf.LayersModel): Promise<Evaluation[]> => {
  const results: Evaluation[] = []
  for (const { name, file, truth } of FIXTURES) {
    const image = await loadPng(`${EXTENSION_DIR}/${file}`)
    const crops = cropTiles(image, locateBoard(image), 0)
    const r = predictLabels(resources, crops.resources, RESOURCES)
    const n = predictLabels(numbers, crops.numbers, HEX_NUMBERS)
    const mistakes: string[] = []
    r.forEach(
      (p, i) => p.label !== truth.resources[i] && mistakes.push(`tile ${i}: ${p.label} for ${truth.resources[i]}`)
    )
    n.forEach((p, i) => p.label !== truth.numbers[i] && mistakes.push(`tile ${i}: ${p.label} for ${truth.numbers[i]}`))
    const all = [...r, ...n]
    results.push({
      fixture: name,
      resourceHits: r.filter((p, i) => p.label === truth.resources[i]).length,
      numberHits: n.filter((p, i) => p.label === truth.numbers[i]).length,
      meanConfidence: all.reduce((s, p) => s + p.confidence, 0) / all.length,
      mistakes,
    })
  }
  return results
}

export const printEvaluation = (title: string, results: Evaluation[]): void => {
  console.log(`\n${title}`)
  for (const r of results) {
    console.log(
      `  ${r.fixture}: resources ${r.resourceHits}/19, numbers ${r.numberHits}/19, mean confidence ${r.meanConfidence.toFixed(3)}`
    )
    for (const m of r.mistakes) console.log(`    - ${m}`)
  }
}
