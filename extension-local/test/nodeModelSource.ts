import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as tf from '@tensorflow/tfjs'

type LayersModelJson = {
  modelTopology: object
  weightsManifest: Array<{ paths: string[]; weights: tf.io.WeightsManifestEntry[] }>
}

/**
 * Loads a TensorFlow.js layers model from disk without `tfjs-node`, which does not run on current
 * Node versions. Only meant for tests: the extension itself fetches the models by URL.
 */
export const nodeModelSource = async (modelJsonPath: string): Promise<tf.io.IOHandler> => {
  const model = JSON.parse(await readFile(modelJsonPath, 'utf-8')) as LayersModelJson

  const weightSpecs = model.weightsManifest.flatMap((group) => group.weights)
  const weightBuffers = await Promise.all(
    model.weightsManifest.flatMap((group) => group.paths.map((path) => readFile(join(dirname(modelJsonPath), path))))
  )
  const weightData = Buffer.concat(weightBuffers)

  return tf.io.fromMemory({
    modelTopology: model.modelTopology,
    weightSpecs,
    weightData: weightData.buffer.slice(weightData.byteOffset, weightData.byteOffset + weightData.byteLength),
  })
}
