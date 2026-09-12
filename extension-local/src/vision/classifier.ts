import * as tf from '@tensorflow/tfjs'
import { ModelLoadError } from './errors'
import { type RgbaImage, type Size, rgbaToRgb } from './pixels'
import { ensureTensorFlowBackend } from './tfjs'

/** A URL the runtime can fetch, or a TensorFlow.js IO handler (used by tests to load from disk). */
export type ModelSource = string | tf.io.IOHandler

export type Prediction<Label extends string> = {
  readonly label: Label
  /** Softmax score of the winning class, between 0 and 1. */
  readonly confidence: number
}

const CHANNELS = 3

/**
 * Wraps a Keras-style image classifier: fixed-size RGB tiles in, one label per tile out.
 * Tiles are classified in a single batch, which is much cheaper than one inference per tile.
 */
export class TileClassifier<Label extends string> {
  private constructor(
    private readonly model: tf.LayersModel,
    private readonly labels: readonly Label[],
    readonly inputSize: Size,
    readonly name: string
  ) {}

  static async load<Label extends string>(
    name: string,
    source: ModelSource,
    labels: readonly Label[]
  ): Promise<TileClassifier<Label>> {
    await ensureTensorFlowBackend()

    let model: tf.LayersModel
    try {
      model = await tf.loadLayersModel(source)
    } catch (cause) {
      throw new ModelLoadError(name, cause)
    }

    const inputShape = model.inputs[0]?.shape ?? []
    const [, height, width, channels] = inputShape
    if (inputShape.length !== 4 || !height || !width || channels !== CHANNELS) {
      model.dispose()
      throw new ModelLoadError(name, new Error(`Unexpected input shape [${inputShape.join(', ')}]`))
    }

    const outputUnits = model.outputs[0]?.shape.at(-1)
    if (outputUnits !== labels.length) {
      model.dispose()
      throw new ModelLoadError(
        name,
        new Error(`Model has ${outputUnits} output classes but ${labels.length} labels were given`)
      )
    }

    return new TileClassifier(model, labels, { width, height }, name)
  }

  async predict(tiles: readonly RgbaImage[]): Promise<Prediction<Label>[]> {
    if (tiles.length === 0) return []

    const { width, height } = this.inputSize
    const tileBytes = width * height * CHANNELS
    const batch = new Uint8Array(tiles.length * tileBytes)

    tiles.forEach((tile, index) => {
      if (tile.width !== width || tile.height !== height) {
        throw new RangeError(
          `${this.name} classifier expects ${width}x${height} tiles, tile ${index} is ${tile.width}x${tile.height}`
        )
      }
      batch.set(rgbaToRgb(tile), index * tileBytes)
    })

    const scores = tf.tidy(() => {
      const input = tf.tensor4d(batch, [tiles.length, height, width, CHANNELS], 'int32').toFloat().div(255)
      const output = this.model.predict(input)
      if (Array.isArray(output)) throw new Error(`${this.name} model returned multiple outputs`)
      return output
    })

    try {
      const flat = await scores.data()
      return tiles.map((_, index) =>
        this.argmax(flat.subarray(index * this.labels.length, (index + 1) * this.labels.length))
      )
    } finally {
      scores.dispose()
    }
  }

  private argmax(scores: ArrayLike<number>): Prediction<Label> {
    let best = 0
    for (let i = 1; i < scores.length; i++) {
      if ((scores[i] ?? -Infinity) > (scores[best] ?? -Infinity)) best = i
    }

    const label = this.labels[best]
    if (label === undefined) throw new Error(`${this.name} classifier produced class index ${best} with no label`)

    return { label, confidence: scores[best] ?? 0 }
  }

  dispose(): void {
    this.model.dispose()
  }
}
