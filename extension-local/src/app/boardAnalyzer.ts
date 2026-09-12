import { type BoardReader, type BoardReading, type ModelSources, createBoardReader } from '../vision/boardReader'
import { type RgbaImage } from '../vision/pixels'

export type ScreenshotProvider = () => Promise<RgbaImage>

export type BoardAnalyzer = {
  /** Captures a screenshot and reads the board from it. */
  analyze(): Promise<BoardReading>
}

type Dependencies = {
  captureScreenshot: ScreenshotProvider
  modelSources: ModelSources
}

/**
 * The single use case of the popup. Model loading is deferred to the first analysis and shared by
 * subsequent ones, so a failed load can be retried by simply analysing again.
 */
export const createBoardAnalyzer = ({ captureScreenshot, modelSources }: Dependencies): BoardAnalyzer => {
  let reader: Promise<BoardReader> | undefined

  const getReader = (): Promise<BoardReader> => {
    reader ??= createBoardReader(modelSources).catch((error: unknown) => {
      reader = undefined
      throw error
    })
    return reader
  }

  return {
    async analyze() {
      // Kick off model loading and the capture together; neither depends on the other.
      const [boardReader, screenshot] = await Promise.all([getReader(), captureScreenshot()])
      return boardReader.read(screenshot)
    },
  }
}
