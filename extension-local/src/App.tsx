import { useMemo, useState } from 'react'
import { type BoardAnalyzer } from './app/boardAnalyzer'
import { useBoardAnalysis } from './app/useBoardAnalysis'
import { BoardView } from './components/Board/BoardView'
import { CameraIcon } from './components/Icons/Icons'
import { Legend, type Weighting } from './components/Legend/Legend'
import { Notice } from './components/Notice/Notice'
import { Players } from './components/Players/Players'
import { Segmented } from './components/Segmented/Segmented'
import { Statistics } from './components/Statistics/Statistics'
import { StatusBar } from './components/StatusBar/StatusBar'
import { Welcome } from './components/Welcome/Welcome'
import { boardWarnings, scarcityFactors, strategyFactors } from './domain'
import { type AnalysisStore } from './platform/analysisStore'
import { DEFAULT_MODEL_SET } from './vision/modelSets'

type AppProps = {
  analyzer: BoardAnalyzer
  analysisStore: AnalysisStore
}

type Tab = 'board' | 'statistics' | 'players'

/** Every tile but the desert carries a number token. */
const EXPECTED_TOKENS = 18

export const App = ({ analyzer, analysisStore }: AppProps) => {
  const [tab, setTab] = useState<Tab>('board')
  const [weighting, setWeighting] = useState<Weighting>('sum')
  const { analysis, isAnalyzing, error, analyze } = useBoardAnalysis(analyzer, analysisStore, DEFAULT_MODEL_SET)

  const reading = analysis?.reading
  const board = reading?.board
  const warnings = useMemo(() => {
    if (!reading) return []
    const found = reading.location.tokensFound
    const partial = found < EXPECTED_TOKENS ? [`Only ${found} of ${EXPECTED_TOKENS} number tokens were found.`] : []
    return [...partial, ...boardWarnings(reading.board)]
  }, [reading])
  const factors = useMemo(() => {
    if (!board || weighting === 'sum') return undefined
    return weighting === 'rarity' ? scarcityFactors(board) : strategyFactors(board)
  }, [board, weighting])

  return (
    <div className="app">
      <main className="app-main">
        {error && <Notice tone="error">{error}</Notice>}
        {warnings.map((warning) => (
          <Notice key={warning} tone="warning">
            {warning} Try capturing again with the whole board visible.
          </Notice>
        ))}

        {!board && <Welcome onCapture={analyze} loading={isAnalyzing} />}

        {board && reading && (
          <>
            <div className="toolbar">
              <Segmented
                ariaLabel="View"
                size="sm"
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'board', label: 'Board' },
                  { value: 'statistics', label: 'Statistics' },
                  { value: 'players', label: 'Players' },
                ]}
              />
              <button
                type="button"
                className={`icon-button ${isAnalyzing ? 'is-busy' : ''}`}
                onClick={analyze}
                disabled={isAnalyzing}
                title="Capture the board again (⌘⇧Y)"
                aria-label="Capture the board again"
              >
                <CameraIcon />
              </button>
            </div>
            {tab === 'board' && (
              <>
                <BoardView board={board} scarcity={factors} pieces={reading.pieces} />
                <Legend weighting={weighting} onWeightingChange={setWeighting} />
              </>
            )}
            {tab === 'statistics' && <Statistics board={board} />}
            {tab === 'players' && <Players board={board} pieces={reading.pieces} />}
          </>
        )}
      </main>

      <StatusBar capturedAt={analysis?.capturedAt} />
    </div>
  )
}
