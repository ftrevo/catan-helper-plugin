const tf = require('@tensorflow/tfjs-node')
const fs = require('fs')
const PNG = require('pngjs').PNG

async function readImage(path, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS) {
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

async function predictImage(
  model,
  path,
  classes,
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  IMAGE_CHANNELS
) {
  const image = await readImage(path, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS)
  const prediction = model.predict(image.expandDims(0))
  const probabilities = prediction.dataSync()
  const result = {}
  for (let i = 0; i < classes.length; i++) {
    result[classes[i]] = probabilities[i]
  }
  return result
}

module.exports = {
  predictImage,
  readImage,
}
