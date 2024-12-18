import { loadLayersModel, tensor, scalar } from '@tensorflow/tfjs-node'

export const predictResource = async (imageBuffer: Buffer) => {
  // Constants from training
  const IMAGE_WIDTH = 64
  const IMAGE_HEIGHT = 80
  const IMAGE_CHANNELS = 3

  const classes = ['brick', 'desert', 'grain', 'lumber', 'stone', 'wool']
  const modelPath = 'file://' + __dirname + '/models/resources/model.json'

  const model = await loadLayersModel(modelPath)

  const firstTensor = tensor(imageBuffer, [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS], 'int32')
  const reshapedTensor = firstTensor.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS])
  const dividedTensor = reshapedTensor.div(scalar(255.0))

  const predictionTensor = model.predict(dividedTensor)

  if ('length' in predictionTensor) {
    throw new Error('Prediction tensor is an array')
  }

  const probabilities = predictionTensor.dataSync()

  const max = Math.max(...probabilities)
  const probabilitiesIndexOfMax = probabilities.indexOf(max)

  return {
    [classes[probabilitiesIndexOfMax]]: max,
  }
}

export const predictNumber = async (imageBuffer: Buffer) => {
  // Constants from training
  const IMAGE_WIDTH = 70
  const IMAGE_HEIGHT = 64
  const IMAGE_CHANNELS = 3

  const classes = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  const modelPath = 'file://' + __dirname + '/models/numbers/model.json'

  const model = await loadLayersModel(modelPath)

  const firstTensor = tensor(imageBuffer, [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS], 'int32')
  const reshapedTensor = firstTensor.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS])
  const dividedTensor = reshapedTensor.div(scalar(255.0))

  const predictionTensor = model.predict(dividedTensor)

  if ('length' in predictionTensor) {
    throw new Error('Prediction tensor is an array')
  }

  const probabilities = predictionTensor.dataSync()

  const max = Math.max(...probabilities)
  const probabilitiesIndexOfMax = probabilities.indexOf(max)

  return {
    [classes[probabilitiesIndexOfMax]]: max,
  }
}
