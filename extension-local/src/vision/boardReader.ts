import { type Board, createBoard } from '../domain/board'
import { type LocatedBoard, locateBoard } from './boardLocator'
import { type ModelSource, TileClassifier } from './classifier'
import { BoardNotFoundError } from './errors'
import { NUMBER_LABELS, RESOURCE_LABELS } from './labels'
import { type CropSpec, NUMBER_CROP, RESOURCE_CROP, cropRect, tileCenters } from './layout'
import { type Point, type RgbaImage, cropAndResize, rectFitsIn } from './pixels'

export type TileConfidence = {
  readonly resource: number
  readonly number: number
}

export type BoardReading = {
  readonly board: Board
  /** Per tile, aligned with `board.tiles`. Useful to flag doubtful tiles. */
  readonly confidence: readonly TileConfidence[]
  /** Where the board was found; handy for diagnostics and for warning about partial detections. */
  readonly location: LocatedBoard
}

export type ModelSources = {
  readonly resources: ModelSource
  readonly numbers: ModelSource
}

export type BoardReader = {
  read(screenshot: RgbaImage): Promise<BoardReading>
  dispose(): void
}

/** Extracts one model-sized tile per board position, scaled from the board's actual size. */
const cropTiles = (screenshot: RgbaImage, centers: readonly Point[], spec: CropSpec, spacing: number): RgbaImage[] =>
  centers.map((center) => {
    const rect = cropRect(center, spec, spacing)
    if (!rectFitsIn(rect, screenshot)) {
      throw new BoardNotFoundError('the board is cut off at the edge of the screenshot')
    }
    return cropAndResize(screenshot, rect, spec.size)
  })

/**
 * Turns a screenshot into a Board: locates the hex grid, crops every tile, classifies resources and
 * numbers in two batched inferences and validates the result against the domain rules.
 */
export const createBoardReader = async (sources: ModelSources): Promise<BoardReader> => {
  const [resources, numbers] = await Promise.all([
    TileClassifier.load('resource', sources.resources, RESOURCE_LABELS),
    TileClassifier.load('number', sources.numbers, NUMBER_LABELS),
  ])

  return {
    async read(screenshot) {
      const location = locateBoard(screenshot)
      const centers = tileCenters(location)

      const [resourcePredictions, numberPredictions] = await Promise.all([
        resources.predict(cropTiles(screenshot, centers, RESOURCE_CROP, location.spacing)),
        numbers.predict(cropTiles(screenshot, centers, NUMBER_CROP, location.spacing)),
      ])

      const board = createBoard(
        resourcePredictions.map((p) => p.label),
        numberPredictions.map((p) => p.label)
      )

      const confidence = board.tiles.map((_, index) => ({
        resource: resourcePredictions[index]?.confidence ?? 0,
        number: numberPredictions[index]?.confidence ?? 0,
      }))

      return { board, confidence, location }
    },

    dispose() {
      resources.dispose()
      numbers.dispose()
    },
  }
}
