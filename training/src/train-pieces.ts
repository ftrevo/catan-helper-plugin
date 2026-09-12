/**
 * Trains the piece detectors: a vertex-patch classifier (empty / settlement / city per colour) and an
 * edge-patch classifier (empty / road per colour), from synthetic boards. Saves to
 * extension-local/public/models/<set>/{buildings,roads}.
 *
 *   npm run train:pieces -- --set pieces-v1 --boards 600 --epochs 10
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import * as tf from '@tensorflow/tfjs-node'
import { BUILDING_KIND_LABELS, COLOUR_LABELS, ROAD_LABELS } from '../../extension-local/src/vision/labels.ts'
import { BUILDING_PATCH, ROAD_PATCH } from '../../extension-local/src/vision/layout.ts'
import { type RgbaImage, cropAndResize } from '../../extension-local/src/vision/pixels.ts'
import { Atlas } from './atlas.ts'
import { type LabelledPatches, type VertexPatches, cropPiecePatches } from './dataset.ts'
import { toBatch } from './evaluate.ts'
import { createModel } from './model.ts'
import { MODELS_DIR } from './paths.ts'
import { Random } from './random.ts'
import { loadTileSprites, renderBoard } from './renderer.ts'

const { values } = parseArgs({
  options: {
    set: { type: 'string', default: 'pieces-v1' },
    boards: { type: 'string', default: '600' },
    epochs: { type: 'string', default: '10' },
    seed: { type: 'string', default: '7' },
    'min-spacing': { type: 'string', default: '70' },
    'max-spacing': { type: 'string', default: '260' },
  },
})
const boards = Number(values.boards)
const epochs = Number(values.epochs)
const random = new Random(Number(values.seed))

/**
 * Photometric and sharpness augmentation. Real captures are softer than the synthetic render (browser
 * scaling, small boards upscaled to the model size), so patches are randomly blurred by a downscale /
 * upscale round trip and get a little sensor-like noise on top of the brightness and colour jitter.
 */
const augment = (image: RgbaImage): RgbaImage => {
  let source = image
  if (random.chance(0.6)) {
    const factor = random.range(0.45, 0.9)
    const small = cropAndResize(
      image,
      { x: 0, y: 0, width: image.width, height: image.height },
      {
        width: Math.max(8, Math.round(image.width * factor)),
        height: Math.max(8, Math.round(image.height * factor)),
      }
    )
    source = cropAndResize(
      small,
      { x: 0, y: 0, width: small.width, height: small.height },
      { width: image.width, height: image.height }
    )
  }
  const gain = random.range(0.88, 1.12)
  const bias = [random.range(-10, 10), random.range(-10, 10), random.range(-10, 10)]
  const noise = random.range(0, 6)
  const data = new Uint8ClampedArray(source.data.length)
  for (let i = 0; i < data.length; i += 4) {
    const n = (random.next() - 0.5) * 2 * noise
    data[i] = (source.data[i] ?? 0) * gain + (bias[0] ?? 0) + n
    data[i + 1] = (source.data[i + 1] ?? 0) * gain + (bias[1] ?? 0) + n
    data[i + 2] = (source.data[i + 2] ?? 0) * gain + (bias[2] ?? 0) + n
    data[i + 3] = 255
  }
  return { ...image, data }
}

const train = async (name: string, data: LabelledPatches, classes: number, size: number) => {
  const xs = toBatch(data.images)
  const ys = tf.oneHot(tf.tensor1d(data.labels, 'int32'), classes)
  const model = createModel('deep', size, size, classes)
  model.compile({ optimizer: tf.train.adam(1e-3), loss: 'categoricalCrossentropy', metrics: ['accuracy'] })
  const counts = data.labels.reduce<Record<number, number>>((acc, l) => ((acc[l] = (acc[l] ?? 0) + 1), acc), {})
  console.log(`\ntraining ${name}: ${data.images.length} patches, ${classes} classes, ${counts[0]} empty`)
  await model.fit(xs, ys, {
    epochs,
    batchSize: 128,
    validationSplit: 0.1,
    shuffle: true,
    callbacks: [
      // Synthetic data is learnt quickly; stop once validation loss stalls instead of burning epochs.
      tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 2 }),
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
  const vertices: VertexPatches = { images: [], kinds: [], colours: [] }
  const roads: LabelledPatches = { images: [], labels: [] }

  console.log(`rendering ${boards} boards`)
  for (let b = 0; b < boards; b++) {
    const spacing = Math.exp(
      random.range(Math.log(Number(values['min-spacing'])), Math.log(Number(values['max-spacing'])))
    )
    // Denser than a real game so the rare classes get enough examples; empty spots still dominate.
    const board = renderBoard(atlas, tileSprites, random, {
      spacing,
      pieceDensity: 0.35,
      roadDensity: 0.3,
      highlightProbability: 0.3,
    })
    const patches = cropPiecePatches(board.image, board, board.pieces, 0.015, random)
    vertices.images.push(...patches.buildings.images.map(augment))
    vertices.kinds.push(...patches.buildings.kinds)
    vertices.colours.push(...patches.buildings.colours)
    roads.images.push(...patches.roads.images.map(augment))
    roads.labels.push(...patches.roads.labels)
    if ((b + 1) % 50 === 0) console.log(`rendered ${b + 1}/${boards} boards`)
  }

  const kindModel = await train(
    'building kinds',
    { images: vertices.images, labels: vertices.kinds },
    BUILDING_KIND_LABELS.length,
    BUILDING_PATCH.size
  )
  const occupied = vertices.colours.map((c, i) => (c >= 0 ? i : -1)).filter((i) => i >= 0)
  const colourModel = await train(
    'piece colours',
    {
      images: occupied.map((i) => vertices.images[i] as RgbaImage),
      labels: occupied.map((i) => vertices.colours[i] as number),
    },
    COLOUR_LABELS.length,
    BUILDING_PATCH.size
  )
  const roadModel = await train('roads', roads, ROAD_LABELS.length, ROAD_PATCH.size)

  const setDir = `${MODELS_DIR}/${values.set}`
  await mkdir(setDir, { recursive: true })
  await kindModel.save(`file://${setDir}/buildings`)
  await colourModel.save(`file://${setDir}/colours`)
  await roadModel.save(`file://${setDir}/roads`)
  await writeFile(
    `${setDir}/manifest.json`,
    JSON.stringify(
      {
        name: values.set,
        trainedAt: new Date().toISOString(),
        architecture: 'deep',
        boards,
        epochs,
        patches: { buildings: BUILDING_PATCH, roads: ROAD_PATCH },
        labels: { buildings: BUILDING_KIND_LABELS, colours: COLOUR_LABELS, roads: ROAD_LABELS },
      },
      null,
      2
    ) + '\n'
  )
  console.log(`\nsaved piece models to ${setDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
