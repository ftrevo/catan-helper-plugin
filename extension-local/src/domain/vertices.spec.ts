import { describe, expect, test } from 'vitest'
import { createBoard } from './board'
import { scarcityFactors } from './statistics'
import { TILE_VERTICES, VERTEX_TILES, tileVertexValues } from './vertices'
import { SAMPLE_BOARD } from '../../test/fixtures/sample-board'

const board = createBoard(SAMPLE_BOARD.resources, SAMPLE_BOARD.numbers)

describe('vertex tables', () => {
  test('there are 54 vertices, each touching one to three tiles', () => {
    expect(VERTEX_TILES).toHaveLength(54)
    for (const tiles of VERTEX_TILES) {
      expect(tiles.length).toBeGreaterThanOrEqual(1)
      expect(tiles.length).toBeLessThanOrEqual(3)
    }
  })

  test('vertex 8 is shared by tiles 0, 1 and 4', () => {
    expect(VERTEX_TILES[8]).toEqual([0, 1, 4])
    expect(TILE_VERTICES[4]).toContain(8)
  })
})

describe('tileVertexValues', () => {
  test('sums producing pips of every neighbouring tile', () => {
    // Tile 0 (brick 8) top vertex touches only tile 0 -> 5 pips.
    // Vertex 8 touches tiles 0 (8), 1 (desert 7) and 4 (grain 3) -> 5 + 0 + 2.
    const values = tileVertexValues(board, 0)
    expect(values[0]).toBe(5)
    expect(values[4]).toBe(7)
  })

  test('weights pips by scarcity when factors are given', () => {
    const factors = scarcityFactors(board)
    const values = tileVertexValues(board, 0, factors)
    expect(values[0]).toBeCloseTo(5 * (factors.get('brick') ?? 0))
  })
})
