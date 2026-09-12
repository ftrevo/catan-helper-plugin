import { describe, expect, test } from 'vitest'
import { HEX_NUMBERS } from './board'
import { pipsOf, producingPipsOf, rollProbability } from './probability'

describe('probability', () => {
  test('pips follow the two-dice distribution', () => {
    expect(HEX_NUMBERS.map(pipsOf)).toEqual([1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1])
  })

  test('a 7 produces nothing', () => {
    expect(producingPipsOf('7')).toBe(0)
    expect(producingPipsOf('6')).toBe(5)
  })

  test('roll probability in percent', () => {
    expect(rollProbability('2')).toBe(2.8)
    expect(rollProbability('6')).toBe(13.9)
    expect(rollProbability('7')).toBe(16.7)
    expect(rollProbability('12')).toBe(2.8)
  })
})
