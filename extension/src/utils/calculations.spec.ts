import { getPipForStatistics, getProbability } from './calculations'

describe('Calculation utilities', () => {
  describe('getPipForStatistics', () => {
    test('returns 0 for "7"', () => {
      expect(getPipForStatistics('7')).toEqual(0)
    })

    test('returns correct pip value for other numbers', () => {
      expect(getPipForStatistics('2')).toEqual(1)
      expect(getPipForStatistics('3')).toEqual(2)
      expect(getPipForStatistics('4')).toEqual(3)
      expect(getPipForStatistics('5')).toEqual(4)
      expect(getPipForStatistics('6')).toEqual(5)
      expect(getPipForStatistics('7')).toEqual(0)
      expect(getPipForStatistics('8')).toEqual(5)
      expect(getPipForStatistics('9')).toEqual(4)
      expect(getPipForStatistics('10')).toEqual(3)
      expect(getPipForStatistics('11')).toEqual(2)
      expect(getPipForStatistics('12')).toEqual(1)
    })
  })

  describe('getProbability', () => {
    test('returns correct probability percentage', () => {
      expect(getProbability('2')).toEqual(2.8)
      expect(getProbability('3')).toEqual(5.6)
      expect(getProbability('4')).toEqual(8.3)
      expect(getProbability('5')).toEqual(11.1)
      expect(getProbability('6')).toEqual(13.9)
      expect(getProbability('7')).toEqual(16.7)
      expect(getProbability('8')).toEqual(13.9)
      expect(getProbability('9')).toEqual(11.1)
      expect(getProbability('10')).toEqual(8.3)
      expect(getProbability('11')).toEqual(5.6)
      expect(getProbability('12')).toEqual(2.8)
    })
  })
})
