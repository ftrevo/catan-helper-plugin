/**
 * Runs the full reading pipeline on a capture and writes the result as JSON, the way the popup would see
 * it: board tiles with confidences, pieces, locator geometry, and derived player statistics.
 *
 *   npm run read -- capture.png reading.json
 *
 * Exit code 0 with `ok: true` when a standard 19-tile board was located, 0 with `ok: false` (and the
 * reason) when it was not, so callers can decide whether to keep the capture.
 */
import { writeFile } from 'node:fs/promises'
import { playerStatistics } from '../src/domain/players'
import { createBoardReader } from '../src/vision/boardReader'
import { DEFAULT_MODEL_SET, modelSetPaths, pieceModelPaths } from '../src/vision/modelSets'
import { loadPng } from '../test/loadPng'
import { nodeModelSource } from '../test/nodeModelSource'

const [, , input, output] = process.argv
if (!input || !output) {
  console.error('usage: read-capture <capture.png> <reading.json>')
  process.exit(2)
}

const tiles = modelSetPaths(DEFAULT_MODEL_SET)
const pieces = pieceModelPaths()

// Piece models are optional: while they are being retrained the board can still be read.
let pieceSources:
  | {
      buildings: Awaited<ReturnType<typeof nodeModelSource>>
      colours: Awaited<ReturnType<typeof nodeModelSource>>
      roads: Awaited<ReturnType<typeof nodeModelSource>>
    }
  | undefined
let piecesUnavailable: string | undefined
try {
  pieceSources = {
    buildings: await nodeModelSource(`public/${pieces.buildings}`),
    colours: await nodeModelSource(`public/${pieces.colours}`),
    roads: await nodeModelSource(`public/${pieces.roads}`),
  }
} catch (error) {
  piecesUnavailable = error instanceof Error ? error.message : String(error)
}

const reader = await createBoardReader({
  resources: await nodeModelSource(`public/${tiles.resources}`),
  numbers: await nodeModelSource(`public/${tiles.numbers}`),
  ...(pieceSources ? { pieces: pieceSources } : {}),
})

const image = await loadPng(input)
const startedAt = Date.now()
let result: Record<string, unknown>
try {
  const reading = await reader.read(image)
  result = {
    ok: true,
    capture: { file: input, width: image.width, height: image.height },
    modelSet: DEFAULT_MODEL_SET,
    location: reading.location,
    board: reading.board.tiles.map((tile, i) => ({ ...tile, confidence: reading.confidence[i] })),
    pieces: reading.pieces,
    ...(piecesUnavailable ? { piecesUnavailable } : {}),
    players: playerStatistics(reading.board, reading.pieces).map((p) => ({
      ...p,
      production: Object.fromEntries(p.production),
    })),
    durationMs: Date.now() - startedAt,
    readAt: new Date().toISOString(),
  }
} catch (error) {
  result = {
    ok: false,
    capture: { file: input, width: image.width, height: image.height },
    reason: error instanceof Error ? error.message : String(error),
    readAt: new Date().toISOString(),
  }
}
reader.dispose()
await writeFile(output, JSON.stringify(result, null, 2) + '\n')
console.log(
  result.ok
    ? `ok: ${(result.pieces as { buildings: unknown[]; roads: unknown[] }).buildings.length} buildings, ${(result.pieces as { roads: unknown[] }).roads.length} roads`
    : `not read: ${result.reason as string}`
)
