import { getStatisticsData, getScarcityFactors } from './statistics'

describe('Statistics utilities', () => {
  const mockData = {
    numbers: ['6', '4', '10', '2', '9'],
    resources: ['brick', 'wool', 'lumber', 'grain', 'stone'],
  }

  describe('getStatisticsData', () => {
    test('properly calculates pip sums for each resource', () => {
      const stats = getStatisticsData(mockData)

      expect(stats.get('brick')?.pipSum).toBe(5)
      expect(stats.get('wool')?.pipSum).toBe(3)
      expect(stats.get('stone')?.pipSum).toBe(4)
    })

    test('properly counts resource occurrences', () => {
      const stats = getStatisticsData(mockData)

      expect(stats.get('brick')?.occurences).toBe(1)
      expect(stats.get('wool')?.occurences).toBe(1)
    })
  })

  describe('getScarcityFactors', () => {
    test('calculates correct scarcity factors', () => {
      const factors = getScarcityFactors(mockData)

      expect(factors.get('brick')).toBeCloseTo(2.32)
      expect(factors.get('wool')).toBeCloseTo(3.87)
    })
  })
})
