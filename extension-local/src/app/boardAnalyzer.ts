import { type BoardReader, type BoardReading, createBoardReader } from '../vision/boardReader'
import { type ModelSetId, modelSetPaths, pieceModelPaths } from '../vision/modelSets'
import { type RgbaImage } from '../vision/pixels'

export type ScreenshotProvider = () => Promise<RgbaImage>

export type BoardAnalyzer = {
  /** Captures a screenshot and reads the board with the given model set. */
  analyze(modelSet: ModelSetId): Promise<BoardReading>
}

type Dependencies = {
  captureScreenshot: ScreenshotProvider
  /** Resolves a model path inside the package to a fetchable URL. */
  resolveModelUrl: (path: string) => string
}

/**
 * The single use case of the popup. Readers are created on first use per model set and kept for the
 * popup's lifetime; a failed load is forgotten so the next analysis retries it.
 */
export const createBoardAnalyzer = ({ captureScreenshot, resolveModelUrl }: Dependencies): BoardAnalyzer => {
  const readers = new Map<ModelSetId, Promise<BoardReader>>()

  const getReader = (modelSet: ModelSetId): Promise<BoardReader> => {
    let reader = readers.get(modelSet)
    if (!reader) {
      const paths = modelSetPaths(modelSet)
      const pieces = pieceModelPaths()
      reader = createBoardReader({
        resources: resolveModelUrl(paths.resources),
        numbers: resolveModelUrl(paths.numbers),
        pieces: {
          buildings: resolveModelUrl(pieces.buildings),
          colours: resolveModelUrl(pieces.colours),
          roads: resolveModelUrl(pieces.roads),
        },
      }).catch((error: unknown) => {
        readers.delete(modelSet)
        throw error
      })
      readers.set(modelSet, reader)
    }
    return reader
  }

  return {
    async analyze(modelSet) {
      // Kick off model loading and the capture together; neither depends on the other.
      const [reader, screenshot] = await Promise.all([getReader(modelSet), captureScreenshot()])
      return reader.read(screenshot)
    },
  }
}
