import { describe, expect, test } from 'vitest'
import { locateBoard } from '../src/vision/boardLocator'
import { BoardNotFoundError } from '../src/vision/errors'
import { FIXTURE_SCREENSHOTS, loadPng } from './fixtures'

describe('locateBoard', () => {
  test('finds the original sample board at spacing 216', async () => {
    const located = locateBoard(await loadPng(FIXTURE_SCREENSHOTS.board1))
    expect(located.spacing).toBeCloseTo(216, 0)
    // Centre tile token measured by hand at (1212, 699).
    expect(located.center.x).toBeCloseTo(1212, -1)
    expect(located.center.y).toBeCloseTo(699, -1)
    expect(located.tokensFound).toBe(18)
  })

  test('finds the smaller live board at spacing ~193', async () => {
    const located = locateBoard(await loadPng(FIXTURE_SCREENSHOTS.board2))
    expect(located.spacing).toBeGreaterThan(190)
    expect(located.spacing).toBeLessThan(197)
    expect(located.center.x).toBeCloseTo(1208, -1)
    expect(located.center.y).toBeCloseTo(718, -1)
    expect(located.tokensFound).toBe(18)
  })

  test('rejects an image without a board', () => {
    const blank = { width: 400, height: 300, data: new Uint8ClampedArray(400 * 300 * 4).fill(60) }
    expect(() => locateBoard(blank)).toThrow(BoardNotFoundError)
  })
})
