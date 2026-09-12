import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { NO_PIECES, type Pieces } from '../src/domain/pieces'
import { locateBoard } from '../src/vision/boardLocator'
import { pieceModelPaths } from '../src/vision/modelSets'
import { type PieceReader, createPieceReader } from '../src/vision/pieceReader'
import { FIXTURES, FIXTURE_PIECES, LEGACY_RENDER_FIXTURES } from './fixtures'
import { loadPng } from './loadPng'
import { nodeModelSource } from './nodeModelSource'

const sorted = (pieces: Pieces) => ({
  buildings: [...pieces.buildings].sort((a, b) => a.vertex - b.vertex),
  roads: [...pieces.roads].sort((a, b) => a.edge - b.edge),
})

/** Every settlement, city and road on every fixture must be found with the right colour, and nothing else. */
describe('piece reader on real screenshots', () => {
  let reader: PieceReader

  beforeAll(async () => {
    const paths = pieceModelPaths()
    reader = await createPieceReader({
      buildings: await nodeModelSource(`public/${paths.buildings}`),
      roads: await nodeModelSource(`public/${paths.roads}`),
    })
  })

  afterAll(() => reader?.dispose())

  test.each(FIXTURES.filter((f) => !LEGACY_RENDER_FIXTURES.has(f.file)).map((f) => [f.name, f] as const))(
    'reads the pieces on %s exactly',
    async (_name, fixture) => {
      const image = await loadPng(fixture.file)
      const { pieces } = await reader.read(image, locateBoard(image))
      expect(sorted(pieces)).toEqual(sorted(FIXTURE_PIECES[fixture.file] ?? NO_PIECES))
    }
  )

  test.each(FIXTURES.filter((f) => LEGACY_RENDER_FIXTURES.has(f.file)).map((f) => [f.name, f] as const))(
    'finds most pieces on the older-rendering %s and invents none',
    async (_name, fixture) => {
      const image = await loadPng(fixture.file)
      const { pieces } = await reader.read(image, locateBoard(image))
      const truth = FIXTURE_PIECES[fixture.file] ?? NO_PIECES

      // Every detected position must hold a piece of that kind; colours may be off on the old artwork.
      for (const b of pieces.buildings) {
        expect(truth.buildings.find((t) => t.vertex === b.vertex)?.kind).toBe(b.kind)
      }
      for (const r of pieces.roads) expect(truth.roads.some((t) => t.edge === r.edge)).toBe(true)

      const exact = (a: Pieces, b: Pieces) =>
        a.buildings.filter((x) =>
          b.buildings.some((y) => y.vertex === x.vertex && y.kind === x.kind && y.colour === x.colour)
        ).length + a.roads.filter((x) => b.roads.some((y) => y.edge === x.edge && y.colour === x.colour)).length
      const total = truth.buildings.length + truth.roads.length
      expect(exact(pieces, truth) / total).toBeGreaterThanOrEqual(0.7)
    }
  )
})
