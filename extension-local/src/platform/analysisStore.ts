import { NO_PIECES } from '../domain/pieces'
import { type BoardReading } from '../vision/boardReader'

export type StoredAnalysis = {
  readonly reading: BoardReading
  /** Epoch milliseconds of the capture. */
  readonly capturedAt: number
  /** Which model set produced the reading. */
  readonly modelSet: string
}

export type AnalysisStore = {
  load(): Promise<StoredAnalysis | undefined>
  save(analysis: StoredAnalysis): Promise<void>
}

const STORAGE_KEY = 'lastAnalysis'

/**
 * Keeps the last reading for the lifetime of the browser session, so reopening the popup shows the board
 * immediately instead of asking for a new capture. `chrome.storage.session` is cleared when Chrome closes.
 */
const chromeSessionStore = (): AnalysisStore => ({
  async load() {
    const stored = await chrome.storage.session.get(STORAGE_KEY)
    const analysis = stored[STORAGE_KEY] as StoredAnalysis | undefined
    // Readings saved before piece detection existed have no `pieces`.
    return analysis
      ? { ...analysis, reading: { ...analysis.reading, pieces: analysis.reading.pieces ?? NO_PIECES } }
      : undefined
  },
  async save(analysis) {
    await chrome.storage.session.set({ [STORAGE_KEY]: analysis })
  },
})

/** Fallback for the dev server, where extension APIs are missing. */
const memoryStore = (): AnalysisStore => {
  let analysis: StoredAnalysis | undefined
  return {
    load: async () => analysis,
    save: async (next) => {
      analysis = next
    },
  }
}

export const createAnalysisStore = (): AnalysisStore =>
  typeof chrome !== 'undefined' && chrome.storage?.session ? chromeSessionStore() : memoryStore()
