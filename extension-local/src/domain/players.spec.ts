import { describe, expect, test } from 'vitest'
import { SAMPLE_BOARD } from '../../test/fixtures'
import { createBoard } from './board'
import { edgeIdOf } from './edges'
import { type Pieces } from './pieces'
import { longestRoad, playerStatistics } from './players'

const board = createBoard(SAMPLE_BOARD.resources, SAMPLE_BOARD.numbers)

describe('longestRoad', () => {
  test('counts a chain and stops at an opponent building', () => {
    // Vertices 0-4-8-12 run down the right side of tile 0 (corners top, upper-right, lower-right, bottom).
    const chain: Pieces = {
      buildings: [],
      roads: [
        { edge: edgeIdOf(0, 4), colour: 'red' },
        { edge: edgeIdOf(4, 8), colour: 'red' },
        { edge: edgeIdOf(8, 12), colour: 'red' },
      ],
    }
    expect(longestRoad(chain, 'red')).toBe(3)
    expect(longestRoad(chain, 'blue')).toBe(0)

    const blocked: Pieces = { ...chain, buildings: [{ vertex: 4, kind: 'settlement', colour: 'blue' }] }
    expect(longestRoad(blocked, 'red')).toBe(2)
  })
})

describe('playerStatistics', () => {
  test('sums production, doubles cities and awards the longest road bonus', () => {
    const pieces: Pieces = {
      buildings: [
        { vertex: 8, kind: 'settlement', colour: 'red' }, // tiles 0 (brick 8), 1 (desert), 4 (grain 3)
        { vertex: 30, kind: 'city', colour: 'blue' }, // tiles 9 (lumber 11), 10 (grain 9), 14 (lumber 4)
      ],
      roads: [
        { edge: edgeIdOf(0, 4), colour: 'red' },
        { edge: edgeIdOf(4, 8), colour: 'red' },
        { edge: edgeIdOf(8, 12), colour: 'red' },
        { edge: edgeIdOf(12, 17), colour: 'red' },
        { edge: edgeIdOf(17, 22), colour: 'red' },
      ],
    }
    const [red, blue] = playerStatistics(board, pieces)

    expect(red?.colour).toBe('red')
    expect(red?.production.get('brick')).toBe(5)
    expect(red?.production.get('grain')).toBe(2)
    expect(red?.longestRoad).toBe(5)
    expect(red?.visiblePoints).toBe(1 + 2)

    expect(blue?.cities).toBe(1)
    expect(blue?.production.get('lumber')).toBe((2 + 3) * 2)
    expect(blue?.production.get('grain')).toBe(4 * 2)
    expect(blue?.visiblePoints).toBe(2)
  })
})
