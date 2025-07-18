import type { ReadCreateData } from '../../typings/api'
import { getProbability } from './calculations'

const hexResources = ['brick', 'desert', 'grain', 'lumber', 'stone', 'wool'] as const
type HexResource = (typeof hexResources)[number]
const isHexResource = (candidateResource: string): candidateResource is HexResource => {
  return hexResources.includes(candidateResource as HexResource)
}
const assertValidHexResource: (candidateResouce: string) => asserts candidateResouce is HexResource = (
  candidateResource
) => {
  if (!isHexResource(candidateResource)) {
    throw new Error('Invalid resource ' + candidateResource)
  }
}

const hexNumbers = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const
type HexNumber = (typeof hexNumbers)[number]
const isHexNumber = (candidateNumber: string): candidateNumber is HexNumber => {
  return hexNumbers.includes(candidateNumber as HexNumber)
}
const assertValidHexNumber: (candidateNumber: string) => asserts candidateNumber is HexNumber = (candidateNumber) => {
  if (!isHexNumber(candidateNumber)) {
    throw new Error('Invalid number ' + candidateNumber)
  }
}

const hexPositions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const
export type HexPosition = (typeof hexPositions)[number]
const isHexPosition = (candidatePosition: number): candidatePosition is HexPosition => {
  return hexPositions.includes(candidatePosition as HexPosition)
}
export const assertValidHexPosition: (candidatePosition: number) => asserts candidatePosition is HexPosition = (
  candidatePosition
) => {
  if (!isHexPosition(candidatePosition)) {
    throw new Error('Invalid position ' + candidatePosition)
  }
}

export const hexagonVertices = [
  [0, 3, 4, 7, 8, 12],
  [1, 4, 5, 8, 9, 13],
  [2, 5, 6, 9, 10, 14],
  [7, 11, 12, 16, 17, 22],
  [8, 12, 13, 17, 18, 23],
  [9, 13, 14, 18, 19, 24],
  [10, 14, 15, 19, 20, 25],
  [16, 21, 22, 27, 28, 33],
  [17, 22, 23, 28, 29, 34],
  [18, 23, 24, 29, 30, 35],
  [19, 24, 25, 30, 31, 36],
  [20, 25, 26, 31, 32, 37],
  [28, 33, 34, 38, 39, 43],
  [29, 34, 35, 39, 40, 44],
  [30, 35, 36, 40, 41, 45],
  [31, 36, 37, 41, 42, 46],
  [39, 43, 44, 47, 48, 51],
  [40, 44, 45, 48, 49, 52],
  [41, 45, 46, 49, 50, 53],
] as const

export type Hexagons = ReturnType<typeof buildHexagons>
export const buildHexagons = (data: ReadCreateData) =>
  data.resources.map((resource, position) => {
    assertValidHexPosition(position)
    assertValidHexResource(resource)

    const num = data.numbers[position]
    assertValidHexNumber(num)

    return {
      resource,
      num,
      position,
      probability: getProbability(num),
      vertices: hexagonVertices[position],
    }
  })
