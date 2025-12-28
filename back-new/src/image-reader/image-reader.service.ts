import { Injectable, Logger } from '@nestjs/common'
import * as sharp from 'sharp'
import type { ReadImageRequestDto } from './dto/read-image-request.dto'
import type { ReadImageResponseDto } from './dto/read-image-response.dto'
import { PredictorService } from './predictor.service'

@Injectable()
export class ImageReaderService {
  private readonly logger = new Logger(ImageReaderService.name)

  constructor(private readonly predictorService: PredictorService) {}

  private async sliceImageFromBase64(
    imageBuffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      const sharpInstance = sharp(imageBuffer)
      const result = await sharpInstance.extract({ left: x, top: y, width: width, height: height }).raw().toBuffer()

      sharpInstance.destroy()

      return result
    } catch (err) {
      this.logger.error('Error slicing image', err)
      throw err
    }
  }

  private async getResources(imageBuffer: Buffer): Promise<Buffer[]> {
    const width = 80
    const height = 64
    const separation = 216
    const resourcePromises: Promise<Buffer>[] = []

    // Line 1
    const l1XStart = 960
    const l1YStart = 202
    for (let position = 0; position <= 2; position++) {
      const x = l1XStart + position * separation
      resourcePromises.push(this.sliceImageFromBase64(imageBuffer, x, l1YStart, width, height))
    }

    // Line 2
    const l2XStart = 852
    const l2YStart = 390
    for (let position = 0; position <= 3; position++) {
      const x = l2XStart + position * separation
      resourcePromises.push(this.sliceImageFromBase64(imageBuffer, x, l2YStart, width, height))
    }

    // Line 3
    const l3XStart = 745
    const l3YStart = 578
    for (let position = 0; position <= 4; position++) {
      const x = l3XStart + position * separation
      resourcePromises.push(this.sliceImageFromBase64(imageBuffer, x, l3YStart, width, height))
    }

    // Line 4
    const l4XStart = 852
    const l4YStart = 764
    for (let position = 0; position <= 3; position++) {
      const x = l4XStart + position * separation
      resourcePromises.push(this.sliceImageFromBase64(imageBuffer, x, l4YStart, width, height))
    }

    // Line 5
    const l5XStart = 960
    const l5YStart = 950
    for (let position = 0; position <= 2; position++) {
      const x = l5XStart + position * separation
      resourcePromises.push(this.sliceImageFromBase64(imageBuffer, x, l5YStart, width, height))
    }

    return Promise.all(resourcePromises)
  }

  private async getNumbers(imageBuffer: Buffer): Promise<Buffer[]> {
    const width = 64
    const height = 70
    const separation = 216
    const numberPromises: Promise<Buffer>[] = []

    // Line 1
    const l1XStart = 965
    const l1YStart = 292
    for (let position = 0; position <= 2; position++) {
      const x = l1XStart + position * separation
      numberPromises.push(this.sliceImageFromBase64(imageBuffer, x, l1YStart, width, height))
    }

    // Line 2
    const l2XStart = 857
    const l2YStart = 477
    for (let position = 0; position <= 3; position++) {
      const x = l2XStart + position * separation
      numberPromises.push(this.sliceImageFromBase64(imageBuffer, x, l2YStart, width, height))
    }

    // Line 3
    const l3XStart = 750
    const l3YStart = 665
    for (let position = 0; position <= 4; position++) {
      const x = l3XStart + position * separation
      numberPromises.push(this.sliceImageFromBase64(imageBuffer, x, l3YStart, width, height))
    }

    // Line 4
    const l4XStart = 857
    const l4YStart = 850
    for (let position = 0; position <= 3; position++) {
      const x = l4XStart + position * separation
      numberPromises.push(this.sliceImageFromBase64(imageBuffer, x, l4YStart, width, height))
    }

    // Line 5
    const l5XStart = 965
    const l5YStart = 1039
    for (let position = 0; position <= 2; position++) {
      const x = l5XStart + position * separation
      numberPromises.push(this.sliceImageFromBase64(imageBuffer, x, l5YStart, width, height))
    }

    return Promise.all(numberPromises)
  }

  async readImage(params: ReadImageRequestDto): Promise<ReadImageResponseDto> {
    this.logger.log('Reading image', {
      tabSize: params.tabSize,
    })

    // Split the base64 string to remove the data URL prefix
    const [prefix, image] = params.image.split(',')

    let imageBuffer: Buffer | null = Buffer.from(image, 'base64')

    // Extract resources and numbers from the image
    const [resources, numbers] = await Promise.all([this.getResources(imageBuffer), this.getNumbers(imageBuffer)])

    imageBuffer = null // Free memory

    // Predict resources using ML model
    const predictedResources = resources.map((resource, index) =>
      this.predictorService.predictResource(resource, index)
    )

    // Predict numbers using ML model
    const predictedNumbers = numbers.map((num, index) => this.predictorService.predictNumber(num, index))

    // Extract the class names from predictions
    const resourceList = predictedResources.map((resource) => Object.keys(resource)[0])
    const numberList = predictedNumbers.map((number) => Object.keys(number)[0])

    return {
      resources: resourceList,
      numbers: numberList,
    }
  }
}
