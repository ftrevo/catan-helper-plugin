import * as tf from '@tensorflow/tfjs-node'

export type Architecture = 'compact' | 'deep'

/**
 * `compact` mirrors the original 2025 models (one conv block, dense softmax).
 * `deep` adds two more conv blocks, batch normalisation and dropout for robustness to scale changes.
 * Both take `[height, width, 3]` inputs in 0..1 and output class probabilities.
 */
export const createModel = (arch: Architecture, height: number, width: number, classes: number): tf.LayersModel => {
  const model = tf.sequential()
  const inputShape = [height, width, 3]

  if (arch === 'compact') {
    model.add(tf.layers.conv2d({ inputShape, filters: 32, kernelSize: 3, activation: 'relu' }))
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }))
    model.add(tf.layers.flatten())
    model.add(tf.layers.dense({ units: classes, activation: 'softmax' }))
    return model
  }

  const block = (filters: number, first = false) => {
    model.add(
      tf.layers.conv2d({
        ...(first ? { inputShape } : {}),
        filters,
        kernelSize: 3,
        padding: 'same',
        activation: 'relu',
      })
    )
    model.add(tf.layers.batchNormalization())
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }))
  }
  block(16, true)
  block(32)
  block(64)
  model.add(tf.layers.flatten())
  model.add(tf.layers.dropout({ rate: 0.3 }))
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
  model.add(tf.layers.dense({ units: classes, activation: 'softmax' }))
  return model
}
