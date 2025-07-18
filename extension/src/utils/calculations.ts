export const AVG_DOTS = 58 / 5

const getPipFromHexagonValue = (hexagonValue: string) => {
  return 6 - Math.abs(7 - parseInt(hexagonValue)) // Number of ways to roll `sum` with two d6:
}

export const getPipForStatistics = (hexagonValue: string) => {
  if (hexagonValue === '7') return 0 // Ignore 7 as it brings no resouces

  return getPipFromHexagonValue(hexagonValue)
}

export const getDisplayPercentage = (percentage: number) => {
  return parseFloat(percentage.toFixed(1))
}

export const getProbability = (hexagonValue: string) => {
  const pipFromHex = getPipFromHexagonValue(hexagonValue)

  const rawProbability = (pipFromHex / 36) * 100

  return getDisplayPercentage(rawProbability)
}
