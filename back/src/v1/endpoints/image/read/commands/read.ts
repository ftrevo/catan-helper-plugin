import type { ReadImageRequestParams } from '../validation'
import { predictResource, predictNumber } from '../../../../../infra/predictor'

import { Board } from './board'

import sharp from 'sharp'
import fs from 'fs'

const sliceImageFromBase64 = (base64Data: string, x: number, y: number, width: number, height: number) => {
  try {
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // return sharp(imageBuffer).extract({ left: x, top: y, width: width, height: height }).toBuffer()
    return sharp(imageBuffer).extract({ left: x, top: y, width: width, height: height }).raw().toBuffer()
  } catch (err) {
    console.error(err)
    throw err
  }
}

const getResources = async (image: string) => {
  const width = 80
  const height = 64

  const separation = 216

  const resourcePromises = []

  const l1XStart = 960
  const l1YStart = 202

  for (let position = 0; position <= 2; position++) {
    const x = l1XStart + position * separation

    resourcePromises.push(sliceImageFromBase64(image, x, l1YStart, width, height))
  }

  const l2XStart = 852
  const l2YStart = 390

  for (let position = 0; position <= 3; position++) {
    const x = l2XStart + position * separation

    resourcePromises.push(sliceImageFromBase64(image, x, l2YStart, width, height))
  }

  const l3XStart = 745
  const l3YStart = 578

  for (let position = 0; position <= 4; position++) {
    const x = l3XStart + position * separation

    resourcePromises.push(sliceImageFromBase64(image, x, l3YStart, width, height))
  }

  const l4XStart = 852
  const l4YStart = 764

  for (let position = 0; position <= 3; position++) {
    const x = l4XStart + position * separation

    resourcePromises.push(sliceImageFromBase64(image, x, l4YStart, width, height))
  }

  const l5XStart = 960
  const l5YStart = 950

  for (let position = 0; position <= 2; position++) {
    const x = l5XStart + position * separation

    resourcePromises.push(sliceImageFromBase64(image, x, l5YStart, width, height))
  }

  const resources = await Promise.all(resourcePromises)

  return resources
}

const getNumbers = async (image: string) => {
  const width = 64
  const height = 70

  const separation = 216

  const numberPromises = []

  const l1XStart = 965
  const l1YStart = 292

  for (let position = 0; position <= 2; position++) {
    const x = l1XStart + position * separation

    numberPromises.push(sliceImageFromBase64(image, x, l1YStart, width, height))
  }

  const l2XStart = 857
  const l2YStart = 477
  // const l2XStart = 852
  // const l2YStart = 390

  for (let position = 0; position <= 3; position++) {
    const x = l2XStart + position * separation

    numberPromises.push(sliceImageFromBase64(image, x, l2YStart, width, height))
  }

  const l3XStart = 750
  const l3YStart = 665
  // const l3XStart = 745
  // const l3YStart = 578

  for (let position = 0; position <= 4; position++) {
    const x = l3XStart + position * separation

    numberPromises.push(sliceImageFromBase64(image, x, l3YStart, width, height))
  }

  const l4XStart = 857
  const l4YStart = 850

  for (let position = 0; position <= 3; position++) {
    const x = l4XStart + position * separation

    numberPromises.push(sliceImageFromBase64(image, x, l4YStart, width, height))
  }

  const l5XStart = 965
  const l5YStart = 1039

  for (let position = 0; position <= 2; position++) {
    const x = l5XStart + position * separation

    numberPromises.push(sliceImageFromBase64(image, x, l5YStart, width, height))
  }

  const numbers = await Promise.all(numberPromises)

  return numbers
}

export const readImageCommand = () => async (params: ReadImageRequestParams) => {
  const [prefix, image] = params.image.split(',')

  const [resources, numbers] = await Promise.all([getResources(image), getNumbers(image)])

  const predictedResources = resources.map(async (resource, index) => {
    // await sharp(num, { raw: { width: 64, height: 80, channels: 3 } }).toFile(`output/resource-${index}.png`)
    // const prediction = await predictResource(num, index)
    // console.log(index, prediction)
    // return prediction
    return predictResource(resource, index)
  })

  const predictedNumbers = numbers.map(async (num, index) => {
    // await sharp(num, { raw: { width: 70, height: 64, channels: 3 } }).toFile(`output/number-${index}.jpg`)
    // const prediction = await predictNumber(num, index)
    // console.log(index, prediction)
    // return prediction
    return predictNumber(num, index)
  })

  const predictedResourcesResolved = await Promise.all(predictedResources)
  const predictedNumbersResolved = await Promise.all(predictedNumbers)

  const resourceList = predictedResourcesResolved.map((resource) => {
    return Object.keys(resource)[0]
  })
  const numberList = predictedNumbersResolved.map((number) => {
    return Object.keys(number)[0]
  })

  // Leftover code from the initial implementation that identified it on the screen itself localy.
  // const board = new Board(resourceList, numberList)

  return {
    resources: resourceList,
    numbers: numberList,
  }
}
