const tf = require('@tensorflow/tfjs-node')
const fs = require('fs')
const PNG = require('pngjs').PNG

// Constants for training
const IMAGE_WIDTH = 64
const IMAGE_HEIGHT = 80
const IMAGE_CHANNELS = 3

const classes = ['brick', 'wool', 'grain', 'lumber', 'rock', 'desert']

const readImage = (path) => {
  const buf = fs.readFileSync(path)
  const png = PNG.sync.read(buf)
  const image = tf.node.decodeImage(
    new Uint8Array(PNG.sync.write(png)),
    IMAGE_CHANNELS
  )
  const normalizedTensor = tf.image
    .resizeBilinear(image, [IMAGE_WIDTH, IMAGE_HEIGHT])
    .div(tf.scalar(255.0))
  return normalizedTensor
}

const predictImage = (model, path) => {
  const image = readImage(path)
  const prediction = model.predict(image.expandDims(0))
  const probabilities = prediction.dataSync()
  const result = {}
  for (let i = 0; i < classes.length; i++) {
    result[classes[i]] = probabilities[i]
  }
  return result
}

const loadModel = async () => {
  const model = await tf.loadLayersModel('file://./model/resources/model.json')
  return model
}

const predict = (model, fileName) => {
  const probabilities = predictImage(model, fileName)

  let max = 0
  let maxClass

  for (const [resource, probability] of Object.entries(probabilities)) {
    if (probability > max) {
      max = probability
      maxClass = resource
    }
  }

  return {
    resource: maxClass,
    chance: max,
  }
}

module.exports = {
  loadModel,
  predict,
}
