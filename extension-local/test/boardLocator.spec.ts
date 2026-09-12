import { describe, expect, test } from 'vitest'
import { locateBoard } from '../src/vision/boardLocator'
import { BoardNotFoundError } from '../src/vision/errors'
import { FIXTURES, LOCATOR_ONLY_FIXTURES, NON_STANDARD_FIXTURES } from './fixtures'
import { loadPng } from './loadPng'

describe('locateBoard', () => {
  test.each(FIXTURES.map((f) => [f.name, f] as const))('finds all 18 tokens in %s', async (_name, fixture) => {
    const located = locateBoard(await loadPng(fixture.file))
    expect(located.tokensFound).toBe(18)
    expect(located.spacing).toBeGreaterThan(fixture.spacing * 0.97)
    expect(located.spacing).toBeLessThan(fixture.spacing * 1.03)
  })

  test.each(LOCATOR_ONLY_FIXTURES.map((f) => [f.name, f] as const))(
    'still fits the lattice on %s',
    async (_name, fixture) => {
      const located = locateBoard(await loadPng(fixture.file))
      expect(located.tokensFound).toBeGreaterThanOrEqual(fixture.minTokens)
      expect(located.spacing).toBeGreaterThan(fixture.spacing * 0.95)
      expect(located.spacing).toBeLessThan(fixture.spacing * 1.05)
    }
  )

  test.each(FIXTURES.map((f) => [f.name, f] as const))('sees no stray tokens on %s', async (_name, fixture) => {
    expect(locateBoard(await loadPng(fixture.file)).extraTokens).toBeLessThanOrEqual(1)
  })

  test.each(NON_STANDARD_FIXTURES.map((f) => [f.name, f] as const))(
    'flags stray tokens on %s',
    async (_name, fixture) => {
      const located = locateBoard(await loadPng(fixture.file))
      expect(located.extraTokens).toBeGreaterThanOrEqual(3)
    }
  )

  test('the original sample is centred where it was measured by hand', async () => {
    const located = locateBoard(await loadPng('test/fixtures/colonist-board.png'))
    expect(located.center.x).toBeCloseTo(1212, -1)
    expect(located.center.y).toBeCloseTo(699, -1)
  })

  test('rejects an image without a board', () => {
    const blank = { width: 400, height: 300, data: new Uint8ClampedArray(400 * 300 * 4).fill(60) }
    expect(() => locateBoard(blank)).toThrow(BoardNotFoundError)
  })
})
