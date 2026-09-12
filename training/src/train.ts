/**
 * Generates synthetic boards, trains a resource and a number classifier on their crops and saves them
 * as a model set the extension can load: extension-local/public/models/<set>/{resources,numbers}.
 *
 *   npm run train -- --set v2-synthetic --arch deep --boards 600 --epochs 12
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import * as tf from '@tensorflow/tfjs-node'
import { HEX_NUMBERS, RESOURCES } from '../../extension-local/src/domain/board.ts'
import { NUMBER_CROP, RESOURCE_CROP } from '../../extension-local/src/vision/layout.ts'
import { type RgbaImage } from '../../extension-local/src/vision/pixels.ts'
import { Atlas } from './atlas.ts'
import { cropTiles } from './dataset.ts'
import { evaluateModels, printEvaluation, toBatch } from './evaluate.ts'
import { type Architecture, createModel } from './model.ts'
import { MODELS_DIR } from './paths.ts'
import { Random } from './random.ts'
import { type TileSprites, loadTileSprites, renderBoard } from './renderer.ts'

const { values } = parseArgs({
  options: {
    set: { type: 'string', default: 'v2-synthetic' },
    arch: { type: 'string', default: 'deep' },
    boards: { type: 'string', default: '600' },
    epochs: { type: 'string', default: '12' },
    seed: { type: 'string', default: '1' },
    'min-spacing': { type: 'string', default: '70' },
    'max-spacing': { type: 'string', default: '260' },
  },
})

const arch = values.arch as Architecture
const boards = Number(values.boards)
const epochs = Number(values.epochs)
const minSpacing = Number(values['min-spacing'])
const maxSpacing = Number(values['max-spacing'])
const random = new Random(Number(values.seed))

/** Small photometric jitter: captures differ slightly in brightness and colour balance. */
const jitterColours = (image: RgbaImage): RgbaImage => {
  const gain = random.range(0.9, 1.1)
  const bias = [random.range(-8, 8), random.range(-8, 8), random.range(-8, 8)]
  const data = new Uint8ClampedArray(image.data.length)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (image.data[i] ?? 0) * gain + (bias[0] ?? 0)
    data[i + 1] = (image.data[i + 1] ?? 0) * gain + (bias[1] ?? 0)
    data[i + 2] = (image.data[i + 2] ?? 0) * gain + (bias[2] ?? 0)
    data[i + 3] = 255
  }
  return { ...image, data }
}

const generate = (atlas: Atlas, tileSprites: TileSprites) => {
  const resources: RgbaImage[] = []
  const resourceLabels: number[] = []
  const numbers: RgbaImage[] = []
  const numberLabels: number[] = []

  for (let b = 0; b < boards; b++) {
    // Log-uniform spacing so small boards (1x displays, small windows) are as common as large ones.
    const spacing = Math.exp(random.range(Math.log(minSpacing), Math.log(maxSpacing)))
    const board = renderBoard(atlas, tileSprites, random, { spacing })
    const crops = cropTiles(board.image, board, 0.02, random)
    board.tiles.forEach((tile, i) => {
      resources.push(jitterColours(crops.resources[i] as RgbaImage))
      resourceLabels.push(RESOURCES.indexOf(tile.resource))
      numbers.push(jitterColours(crops.numbers[i] as RgbaImage))
      numberLabels.push(HEX_NUMBERS.indexOf(tile.number))
    })
    if ((b + 1) % 50 === 0) console.log(`rendered ${b + 1}/${boards} boards`)
  }
  return { resources, resourceLabels, numbers, numberLabels }
}

const train = async (
  name: string,
  tiles: RgbaImage[],
  labels: number[],
  classes: number,
  size: { width: number; height: number }
) => {
  const xs = toBatch(tiles)
  const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), classes)
  const model = createModel(arch, size.height, size.width, classes)
  model.compile({ optimizer: tf.train.adam(1e-3), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
  console.log(`\ntraining ${name}: ${tiles.length} samples, ${classes} classes, ${arch} architecture`)
  await model.fit(xs, ys, {
    epochs,
    batchSize: 64,
    validationSplit: 0.1,
    shuffle: true,
    callbacks: [
      // Synthetic data is learnt quickly; stop once validation loss stalls instead of burning epochs.
      tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 3 }),
      new tf.CustomCallback({
        onEpochEnd: async (epoch: number, logs?: tf.Logs) =>
          console.log(
            `  epoch ${epoch + 1}/${epochs} loss ${logs?.loss?.toFixed(4)} acc ${logs?.acc?.toFixed(4)} val_acc ${logs?.val_acc?.toFixed(4)}`
          ),
      }),
    ],
  })
  xs.dispose()
  ys.dispose()
  return model
}

const main = async () => {
  const atlas = await Atlas.load()
  const tileSprites = await loadTileSprites()
  console.log(`generating ${boards} boards with spacing ${minSpacing}..${maxSpacing}`)
  const data = generate(atlas, tileSprites)

  const resources = await train('resources', data.resources, data.resourceLabels, RESOURCES.length, RESOURCE_CROP.size)
  const numbers = await train('numbers', data.numbers, data.numberLabels, HEX_NUMBERS.length, NUMBER_CROP.size)

  const setDir = `${MODELS_DIR}/${values.set}`
  await mkdir(setDir, { recursive: true })
  await resources.save(`file://${setDir}/resources`)
  await numbers.save(`file://${setDir}/numbers`)
  await writeFile(
    `${setDir}/manifest.json`,
    JSON.stringify(
      {
        name: values.set,
        trainedAt: new Date().toISOString(),
        architecture: arch,
        boards,
        epochs,
        spacing: [minSpacing, maxSpacing],
        seed: Number(values.seed),
        labels: { resources: RESOURCES, numbers: HEX_NUMBERS },
      },
      null,
      2
    ) + '\n'
  )
  console.log(`\nsaved model set to ${setDir}`)

  printEvaluation(`evaluation of ${values.set} on real fixtures`, await evaluateModels(resources, numbers))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
