import type { ReadCreateData } from '../../typings/api'

export const HOST = 'http://localhost:3300'

export const getPipFromHexagonValue = (hexagonValue: string) => {
  // Number of ways to roll `sum` with two d6:
  return 6 - Math.abs(7 - parseInt(hexagonValue))
}

export const getPipForStatistics = (hexagonValue: string) => {
  if (hexagonValue === '7') return 0 // Ignore 7 as it brings no resouces

  return getPipFromHexagonValue(hexagonValue)
}

export const getDisplayPercentage = (percentage: number) => {
  return parseFloat(percentage.toFixed(1))
}

export const getStatisticsData = (data: ReadCreateData) => {
  const pips: Array<number> = []

  const resources = new Map<string, { pipSum: number; occurences: number; numberSet: Set<string> }>()

  data.resources.forEach((resource, index) => {
    if (resource === 'desert') return

    const resourceData = resources.get(resource)
    const hexagonNumber = data.numbers[index]

    const pip = getPipForStatistics(hexagonNumber)
    pips.push(pip)

    if (resourceData) {
      resourceData.pipSum = resourceData.pipSum + pip
      resourceData.occurences += 1
      resourceData.numberSet.add(hexagonNumber)
    } else {
      resources.set(resource, {
        pipSum: pip,

        occurences: 1,
        numberSet: new Set([hexagonNumber]),
      })
    }
  })

  console.log('Resources:', resources)

  return resources
}

const AVG_DOTS = 58 / 5

export const getScarcityFactors = (data: ReadCreateData) => {
  const resourceList = Array.from(getStatisticsData(data).entries())

  const factors: Map<string, number> = new Map()

  resourceList.forEach(([resource, { pipSum }]) => {
    factors.set(resource, AVG_DOTS / pipSum)
  })

  console.log('Scarcity Factors:', factors)

  return factors
}
