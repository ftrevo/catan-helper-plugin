import type { ReadCreateData } from '../../typings/api'
import { getPipForStatistics, AVG_DOTS } from './calculations'

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

  return resources
}

export const getScarcityFactors = (data: ReadCreateData) => {
  const resourceList = Array.from(getStatisticsData(data).entries())

  const factors: Map<string, number> = new Map()

  resourceList.forEach(([resource, { pipSum }]) => {
    factors.set(resource, AVG_DOTS / pipSum)
  })

  return factors
}
