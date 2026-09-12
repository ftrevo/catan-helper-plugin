import { describe, expect, test } from 'vitest'
import { createBoard } from './board'
import { resourceStatistics, scarcityFactors } from './statistics'
import { SAMPLE_BOARD } from '../../test/fixtures/sample-board'

const board = createBoard(SAMPLE_BOARD.resources, SAMPLE_BOARD.numbers)

describe('resourceStatistics', () => {
  test('sums producing pips per resource and skips the desert', () => {
    const stats = resourceStatistics(board)

    expect(stats.has('desert')).toBe(false)
    // brick tiles: 8, 11, 6 -> 5 + 2 + 5
    expect(stats.get('brick')).toMatchObject({ pipSum: 12, tileCount: 3 })
    expect([...(stats.get('brick')?.numbers ?? [])].sort()).toEqual(['11', '6', '8'])
    // stone tiles: 12, 5, 10 -> 1 + 4 + 3
    expect(stats.get('stone')?.pipSum).toBe(8)
  })

  test('all producing pips add up to the standard 58', () => {
    const total = [...resourceStatistics(board).values()].reduce((sum, s) => sum + s.pipSum, 0)
    expect(total).toBe(58)
  })
})

describe('scarcityFactors', () => {
  test('rarer resources get a factor above 1', () => {
    const factors = scarcityFactors(board)
    expect(factors.get('stone')).toBeCloseTo(58 / 5 / 8)
    expect(factors.get('brick')).toBeCloseTo(58 / 5 / 12)
  })
})
