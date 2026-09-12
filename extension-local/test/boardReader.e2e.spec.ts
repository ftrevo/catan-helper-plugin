import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { type BoardReader, createBoardReader } from '../src/vision/boardReader'
import { BoardNotFoundError } from '../src/vision/errors'
import { FIXTURE_SCREENSHOTS, SAMPLE_BOARD, SAMPLE_BOARD_2, loadPng } from './fixtures'
import { nodeModelSource } from './nodeModelSource'

describe('board reader on real screenshots', () => {
  let reader: BoardReader

  beforeAll(async () => {
    reader = await createBoardReader({
      resources: await nodeModelSource('public/models/resources/model.json'),
      numbers: await nodeModelSource('public/models/numbers/model.json'),
    })
  })

  afterAll(() => reader?.dispose())

  test.each([
    ['original sample (spacing 216)', FIXTURE_SCREENSHOTS.board1, SAMPLE_BOARD],
    ['live bots game (spacing ~193)', FIXTURE_SCREENSHOTS.board2, SAMPLE_BOARD_2],
  ])('reads every tile of the %s', async (_name, path, expected) => {
    const { board, confidence, location } = await reader.read(await loadPng(path))

    expect(board.tiles.map((t) => t.resource)).toEqual(expected.resources)
    expect(board.tiles.map((t) => t.number)).toEqual(expected.numbers)

    expect(location.tokensFound).toBe(18)
    expect(confidence).toHaveLength(19)
    for (const tile of confidence) {
      expect(tile.resource).toBeGreaterThan(0.5)
      expect(tile.number).toBeGreaterThan(0.5)
    }
  })

  test('rejects a screenshot without a board', async () => {
    const blank = { width: 400, height: 300, data: new Uint8ClampedArray(400 * 300 * 4).fill(60) }
    await expect(reader.read(blank)).rejects.toBeInstanceOf(BoardNotFoundError)
  })
})
