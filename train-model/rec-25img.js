const tf = require('@tensorflow/tfjs-node')
const fs = require('fs')
const PNG = require('pngjs').PNG

// Constants for training
const IMAGE_WIDTH = 64
const IMAGE_HEIGHT = 80
const IMAGE_CHANNELS = 3
const classes = ['brick', 'wool', 'grain', 'lumber', 'rock']

// Function to load and preprocess image
async function readImage(path) {
  const buf = fs.readFileSync(path)
  const png = PNG.sync.read(buf)
  const image = tf.node.decodeImage(
    new Uint8Array(PNG.sync.write(png)),
    IMAGE_CHANNELS
  )
  const normalizedImage = tf.image
    .resizeBilinear(image, [IMAGE_WIDTH, IMAGE_HEIGHT])
    .div(tf.scalar(255.0))
  return normalizedImage
}

// Function to load images and labels
async function loadResourcesDataset(dataset) {
  const labels = []
  const images = []
  for (let i = 0; i < classes.length; i++) {
    const dir = `./resources/${dataset}/${classes[i]}`
    const files = fs.readdirSync(dir)
    for (let j = 0; j < files.length; j++) {
      const imagePath = `${dir}/${files[j]}`
      const image = await readImage(imagePath)
      images.push(image)
      labels.push(i)
    }
  }
  const xs = tf.stack(images)
  const ys = tf.oneHot(tf.tensor1d(labels).toInt(), classes.length)
  return { xs, ys }
}

// Function to create model
function createModel(numClasses) {
  const model = tf.sequential()
  model.add(
    tf.layers.conv2d({
      inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
    })
  )
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }))
  model.add(tf.layers.flatten())
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }))
  return model
}

async function predictImage(model, path) {
  const image = await readImage(path)
  const prediction = model.predict(image.expandDims(0))
  const probabilities = prediction.dataSync()
  const result = {}
  for (let i = 0; i < classes.length; i++) {
    result[classes[i]] = probabilities[i]
  }
  return result
}

async function run() {
  const modelName = '25imgs'
  // const modelName = 'strong'

  const dataset = await loadResourcesDataset(modelName)

  const modelPath = 'file://./models/' + modelName
  let model
  try {
    model = await tf.loadLayersModel(modelPath + '/model.json')
    console.log('Model', modelPath, 'loaded from disk')
  } catch (err) {
    console.log('No existing model found, creating a new one')
    model = createModel(classes.length)
    model.compile({
      optimizer: tf.train.adam(),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })
    await model.fit(dataset.xs, dataset.ys, { epochs: 5 })
    await model.save(modelPath)
  }

  classes.forEach(async (classe) => {
    const probabilities = await predictImage(model, `./${classe}.png`)
    console.log(classe, probabilities)
  })
}

module.exports = run

// 40 x 30 screenshoot - height: 64 px width: 80 px
