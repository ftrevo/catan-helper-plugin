import { loadLayersModel, tensor, scalar, type LayersModel } from '@tensorflow/tfjs-node'
import { resolve } from 'node:path'

const resourceModelPath = resolve(__dirname, '../../models/resources/model.json')
const numberModelPath = resolve(__dirname, '../../models/numbers/model.json')

let resourceModel: LayersModel | null = null
let numberModel: LayersModel | null = null

// TODO: Think on a better way to handle models initialization
export const initializeModels = async () => {
  if (!resourceModel) {
    resourceModel = await loadLayersModel(`file://${resourceModelPath}`)
  }
  if (!numberModel) {
    numberModel = await loadLayersModel(`file://${numberModelPath}`)
  }
}

export const predictResource = async (imageBuffer: Buffer, index: number) => {
  // Constants from training
  const IMAGE_WIDTH = 64
  const IMAGE_HEIGHT = 80
  const IMAGE_CHANNELS = 3

  const classes = ['brick', 'desert', 'grain', 'lumber', 'stone', 'wool']

  if (!resourceModel) {
    throw new Error('Resource model not initialized. Call initializeModels() first.')
  }

  const firstTensor = tensor(imageBuffer, [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS], 'int32')
  const reshapedTensor = firstTensor.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS])
  const dividedTensor = reshapedTensor.div(scalar(255.0))

  const predictionTensor = resourceModel.predict(dividedTensor)

  if ('length' in predictionTensor) {
    throw new Error('Prediction tensor is an array')
  }

  const probabilities = predictionTensor.dataSync()

  const max = Math.max(...probabilities)
  const probabilitiesIndexOfMax = probabilities.indexOf(max)

  // console.log(
  //   `Predicted resource for image index ${index}: ${classes[probabilitiesIndexOfMax]} with probability ${max}`
  // )

  return {
    [classes[probabilitiesIndexOfMax]]: max,
  }
}

export const predictNumber = async (imageBuffer: Buffer, imageIndex: number) => {
  // Constants from training
  const IMAGE_WIDTH = 70
  const IMAGE_HEIGHT = 64
  const IMAGE_CHANNELS = 3

  const classes = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  if (!numberModel) {
    throw new Error('Number model not initialized. Call initializeModels() first.')
  }

  const firstTensor = tensor(imageBuffer, [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS], 'int32')
  const reshapedTensor = firstTensor.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS])
  const dividedTensor = reshapedTensor.div(scalar(255.0))

  const predictionTensor = numberModel.predict(dividedTensor)

  if ('length' in predictionTensor) {
    throw new Error('Prediction tensor is an array')
  }

  const probabilities = predictionTensor.dataSync()

  const max = Math.max(...probabilities)
  const probabilitiesIndexOfMax = probabilities.indexOf(max)

  // console.log(
  //   `Predicted number for image index ${imageIndex}: ${classes[probabilitiesIndexOfMax]} with probability ${max}`
  // )

  return {
    [classes[probabilitiesIndexOfMax]]: max,
  }
}
