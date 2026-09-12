import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { type BoardReader, createBoardReader } from '../src/vision/boardReader'
import { BoardNotFoundError } from '../src/vision/errors'
import { MODEL_SETS, modelSetPaths } from '../src/vision/modelSets'
import { FIXTURES } from './fixtures'
import { loadPng } from './loadPng'
import { nodeModelSource } from './nodeModelSource'

/**
 * Every shipped model set must read every fixture perfectly. This is the regression net for changes to
 * the vision code, the crop geometry and the model files alike.
 */
describe.each(MODEL_SETS.map((set) => [set.id] as const))('model set %s', (setId) => {
  let reader: BoardReader

  beforeAll(async () => {
    const paths = modelSetPaths(setId)
    reader = await createBoardReader({
      resources: await nodeModelSource(`public/${paths.resources}`),
      numbers: await nodeModelSource(`public/${paths.numbers}`),
    })
  })

  afterAll(() => reader?.dispose())

  test.each(FIXTURES.map((f) => [f.name, f] as const))('reads every tile of %s', async (_name, fixture) => {
    const { board, confidence, location } = await reader.read(await loadPng(fixture.file))

    expect(board.tiles.map((t) => t.resource)).toEqual(fixture.truth.resources)
    expect(board.tiles.map((t) => t.number)).toEqual(fixture.truth.numbers)
    expect(location.tokensFound).toBe(18)
    expect(confidence).toHaveLength(19)
  })

  test('rejects a screenshot without a board', async () => {
    const blank = { width: 400, height: 300, data: new Uint8ClampedArray(400 * 300 * 4).fill(60) }
    await expect(reader.read(blank)).rejects.toBeInstanceOf(BoardNotFoundError)
  })
})
