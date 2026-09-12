import { describe, expect, test } from 'vitest'
import { boardWarnings, createBoard } from './board'
import { SAMPLE_BOARD } from '../../test/fixtures'

describe('createBoard', () => {
  test('builds 19 typed tiles', () => {
    const board = createBoard(SAMPLE_BOARD.resources, SAMPLE_BOARD.numbers)
    expect(board.tiles).toHaveLength(19)
    expect(board.tiles[1]).toEqual({ position: 1, resource: 'desert', number: '7' })
  })

  test('rejects wrong sizes and unknown labels', () => {
    expect(() => createBoard(['brick'], ['2'])).toThrow(/19 tiles/)
    expect(() => createBoard([...SAMPLE_BOARD.resources.slice(0, 18), 'gold'], SAMPLE_BOARD.numbers)).toThrow(/gold/)
    expect(() => createBoard(SAMPLE_BOARD.resources, [...SAMPLE_BOARD.numbers.slice(0, 18), '13'])).toThrow(/13/)
  })
})

describe('boardWarnings', () => {
  test('a consistent board has no warnings', () => {
    expect(boardWarnings(createBoard(SAMPLE_BOARD.resources, SAMPLE_BOARD.numbers))).toEqual([])
  })

  test('flags desert and 7 disagreements', () => {
    const numbers = [...SAMPLE_BOARD.numbers]
    numbers[0] = '7'
    const warnings = boardWarnings(createBoard(SAMPLE_BOARD.resources, numbers))
    expect(warnings).toEqual(['Tile 1 mix desert and number readings.'])
  })
})
