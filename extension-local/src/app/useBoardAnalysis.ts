import { useCallback, useEffect, useState } from 'react'
import { type AnalysisStore, type StoredAnalysis } from '../platform/analysisStore'
import { type BoardAnalyzer } from './boardAnalyzer'
import { describeError } from './describeError'

export type BoardAnalysisState = {
  readonly analysis: StoredAnalysis | undefined
  readonly isAnalyzing: boolean
  readonly error: string | undefined
  analyze(): void
}

/** Popup state around the analyzer: restores the last reading on mount, runs new analyses on demand. */
export const useBoardAnalysis = (analyzer: BoardAnalyzer, store: AnalysisStore): BoardAnalysisState => {
  const [analysis, setAnalysis] = useState<StoredAnalysis>()
  const [isAnalyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false
    store
      .load()
      .then((stored) => {
        if (!cancelled && stored) setAnalysis(stored)
      })
      .catch(() => {
        /* A missing previous reading is not an error worth showing. */
      })
    return () => {
      cancelled = true
    }
  }, [store])

  const analyze = useCallback(() => {
    setAnalyzing(true)
    setError(undefined)

    analyzer
      .analyze()
      .then(async (reading) => {
        const next: StoredAnalysis = { reading, capturedAt: Date.now() }
        setAnalysis(next)
        await store.save(next)
      })
      .catch((failure: unknown) => setError(describeError(failure)))
      .finally(() => setAnalyzing(false))
  }, [analyzer, store])

  return { analysis, isAnalyzing, error, analyze }
}
