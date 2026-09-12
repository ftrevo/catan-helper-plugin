import { describe, expect, test } from 'vitest'
import { SAMPLE_BOARD } from '../../test/fixtures'
import { createBoard } from './board'
import { producingPipsOf } from './probability'
import { totalProducingPips } from './statistics'
import { resourceDemand, strategicWeights, strategyFactors } from './strategy'

const board = createBoard(SAMPLE_BOARD.resources, SAMPLE_BOARD.numbers)

describe('resourceDemand', () => {
  test('adds up building costs for the typical game', () => {
    const demand = resourceDemand()
    // 8 roads + 3 settlements need 11 brick and 11 lumber; 4 cities + 4 dev cards need 16 ore.
    expect(demand.get('brick')).toBe(11)
    expect(demand.get('lumber')).toBe(11)
    expect(demand.get('wool')).toBe(7)
    expect(demand.get('grain')).toBe(15)
    expect(demand.get('stone')).toBe(16)
  })
})

describe('strategicWeights', () => {
  test('average 1, with ore and grain above and wool below', () => {
    const weights = strategicWeights()
    const mean = [...weights.values()].reduce((s, w) => s + w, 0) / weights.size
    expect(mean).toBeCloseTo(1)
    expect(weights.get('stone')).toBeGreaterThan(1)
    expect(weights.get('grain')).toBeGreaterThan(1)
    expect(weights.get('wool')).toBeLessThan(weights.get('brick') ?? 0)
  })
})

describe('strategyFactors', () => {
  test('keeps the weighted board total equal to the pip total', () => {
    const factors = strategyFactors(board)
    const weighted = board.tiles.reduce((s, t) => s + producingPipsOf(t.number) * (factors.get(t.resource) ?? 0), 0)
    expect(weighted).toBeCloseTo(totalProducingPips(board))
  })

  test('ranks scarce, in-demand ore above plentiful wool', () => {
    const factors = strategyFactors(board)
    expect(factors.get('stone')).toBeGreaterThan(factors.get('wool') ?? 0)
  })
})
