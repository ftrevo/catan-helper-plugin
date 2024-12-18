const tf = require('@tensorflow/tfjs-node')
const fs = require('fs')
const { predictImage, readImage } = require('./utils')

// Constants for training
const IMAGE_WIDTH = 80
const IMAGE_HEIGHT = 64
const IMAGE_CHANNELS = 3

const classes = ['2', '3', '4', '5', '6', '8', '9', '10', '11', '12']

// Function to load images and labels
async function loadDataset(dataset) {
  const labels = []
  const images = []
  for (let i = 0; i < classes.length; i++) {
    const dir = `./dataset/${dataset}/${classes[i]}`
    const files = fs.readdirSync(dir)
    for (let j = 0; j < files.length; j++) {
      const imagePath = `${dir}/${files[j]}`
      const image = await readImage(
        imagePath,
        IMAGE_WIDTH,
        IMAGE_HEIGHT,
        IMAGE_CHANNELS
      )
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

async function run() {
  const modelName = 'num-35img'

  const modelPath = 'file://./models/' + modelName

  let model

  try {
    model = await tf.loadLayersModel(modelPath + '/model.json')
    console.log('Model already present', modelPath)
  } catch (err) {
    console.log('Model not present', modelPath)

    const dataset = await loadDataset(modelName)

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
    const probabilities = await predictImage(
      model,
      `./test/${classe}.png`,
      classes,
      IMAGE_WIDTH,
      IMAGE_HEIGHT,
      IMAGE_CHANNELS
    )
    console.log(classe, probabilities)
  })
}

module.exports = run
