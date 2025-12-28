import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { loadLayersModel, scalar, tensor, type LayersModel } from '@tensorflow/tfjs-node'
import { resolve } from 'node:path'

const resourceClasses = ['brick', 'desert', 'grain', 'lumber', 'stone', 'wool']
const numberClasses = ['2', '3', '4', '5', '6', '8', '9', '10', '11', '12']

@Injectable()
export class PredictorService implements OnModuleInit {
  private readonly logger = new Logger(PredictorService.name)
  private resourceModel: LayersModel | null = null
  private numberModel: LayersModel | null = null

  async onModuleInit() {
    await this.initializeModels()
  }

  private async initializeModels(): Promise<void> {
    try {
      const resourceModelPath = resolve(__dirname, '../../models/resources/model.json')
      const numberModelPath = resolve(__dirname, '../../models/numbers/model.json')

      this.logger.log('Loading ML models...')

      if (!this.resourceModel) {
        this.resourceModel = await loadLayersModel(`file://${resourceModelPath}`)
        this.logger.log('Resource model loaded successfully')
      }

      if (!this.numberModel) {
        this.numberModel = await loadLayersModel(`file://${numberModelPath}`)
        this.logger.log('Number model loaded successfully')
      }
    } catch (error) {
      this.logger.error('Failed to load ML models', error)
      throw error
    }
  }

  predictResource(imageBuffer: Buffer, index: number): Record<string, number> {
    // Constants from training
    const IMAGE_WIDTH = 64
    const IMAGE_HEIGHT = 80
    const IMAGE_CHANNELS = 3

    if (!this.resourceModel) {
      throw new Error('Resource model not initialized. Call initializeModels() first.')
    }

    const firstTensor = tensor(imageBuffer, [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS], 'int32')
    const reshapedTensor = firstTensor.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS])
    const dividedTensor = reshapedTensor.div(scalar(255.0))

    const predictionTensor = this.resourceModel.predict(dividedTensor)

    firstTensor.dispose()
    reshapedTensor.dispose()
    dividedTensor.dispose()

    if ('length' in predictionTensor) {
      throw new Error('Prediction tensor is an array')
    }

    const probabilities = predictionTensor.dataSync()
    predictionTensor.dispose()

    const max = Math.max(...probabilities)
    const probabilitiesIndexOfMax = probabilities.indexOf(max)

    return {
      [resourceClasses[probabilitiesIndexOfMax]]: max,
    }
  }

  predictNumber(imageBuffer: Buffer, imageIndex: number): Record<string, number> {
    // Constants from training
    const IMAGE_WIDTH = 70
    const IMAGE_HEIGHT = 64
    const IMAGE_CHANNELS = 3

    if (!this.numberModel) {
      throw new Error('Number model not initialized. Call initializeModels() first.')
    }

    const firstTensor = tensor(imageBuffer, [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS], 'int32')
    const reshapedTensor = firstTensor.reshape([1, IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS])
    const dividedTensor = reshapedTensor.div(scalar(255.0))

    const predictionTensor = this.numberModel.predict(dividedTensor)
    firstTensor.dispose()
    reshapedTensor.dispose()
    dividedTensor.dispose()

    if ('length' in predictionTensor) {
      throw new Error('Prediction tensor is an array')
    }

    const probabilities = predictionTensor.dataSync()
    predictionTensor.dispose()

    const max = Math.max(...probabilities)
    const probabilitiesIndexOfMax = probabilities.indexOf(max)

    return {
      [numberClasses[probabilitiesIndexOfMax]]: max,
    }
  }
}
