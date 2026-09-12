import { useMemo, useState } from 'react'
import { type BoardAnalyzer } from './app/boardAnalyzer'
import { useBoardAnalysis } from './app/useBoardAnalysis'
import { useSettings } from './app/useSettings'
import { BoardView } from './components/Board/BoardView'
import { Header } from './components/Header/Header'
import { Legend } from './components/Legend/Legend'
import { ModelPicker } from './components/ModelPicker/ModelPicker'
import { Notice } from './components/Notice/Notice'
import { Segmented } from './components/Segmented/Segmented'
import { Statistics } from './components/Statistics/Statistics'
import { StatusBar } from './components/StatusBar/StatusBar'
import { Welcome } from './components/Welcome/Welcome'
import { boardWarnings, scarcityFactors } from './domain'
import { type AnalysisStore } from './platform/analysisStore'
import { type SettingsStore } from './platform/settingsStore'

type AppProps = {
  analyzer: BoardAnalyzer
  analysisStore: AnalysisStore
  settingsStore: SettingsStore
}

type Tab = 'board' | 'statistics'
type Weighting = 'sum' | 'rarity'

/** Every tile but the desert carries a number token. */
const EXPECTED_TOKENS = 18

export const App = ({ analyzer, analysisStore, settingsStore }: AppProps) => {
  const [tab, setTab] = useState<Tab>('board')
  const [weighting, setWeighting] = useState<Weighting>('sum')
  const [settings, updateSettings] = useSettings(settingsStore)
  const { analysis, isAnalyzing, error, analyze } = useBoardAnalysis(analyzer, analysisStore, settings.modelSet)

  const reading = analysis?.reading
  const board = reading?.board
  const rarityMode = weighting === 'rarity'
  const warnings = useMemo(() => {
    if (!reading) return []
    const found = reading.location.tokensFound
    const partial = found < EXPECTED_TOKENS ? [`Only ${found} of ${EXPECTED_TOKENS} number tokens were found.`] : []
    return [...partial, ...boardWarnings(reading.board)]
  }, [reading])
  const scarcity = useMemo(() => (board && rarityMode ? scarcityFactors(board) : undefined), [board, rarityMode])

  return (
    <div className="app">
      <Header onRefresh={board ? analyze : undefined} refreshing={isAnalyzing} />

      <main className="app-main">
        {error && <Notice tone="error">{error}</Notice>}
        {warnings.map((warning) => (
          <Notice key={warning} tone="warning">
            {warning} Try capturing again with the whole board visible.
          </Notice>
        ))}

        {!board && <Welcome onCapture={analyze} loading={isAnalyzing} />}

        {board && (
          <>
            <div className="toolbar">
              <Segmented
                ariaLabel="View"
                value={tab}
                onChange={setTab}
                options={[
                  { value: 'board', label: 'Board' },
                  { value: 'statistics', label: 'Statistics' },
                ]}
              />
              {tab === 'board' && (
                <Segmented
                  ariaLabel="Vertex weighting"
                  size="sm"
                  value={weighting}
                  onChange={setWeighting}
                  options={[
                    { value: 'sum', label: 'Sum', title: 'Plain pip sums' },
                    { value: 'rarity', label: 'Rarity', title: 'Pips weighted by how scarce each resource is' },
                  ]}
                />
              )}
            </div>
            {tab === 'board' && (
              <>
                <BoardView board={board} scarcity={scarcity} />
                <Legend rarityMode={rarityMode} />
              </>
            )}
            {tab === 'statistics' && <Statistics board={board} />}
          </>
        )}
      </main>

      <StatusBar capturedAt={analysis?.capturedAt} modelSet={analysis?.modelSet}>
        <ModelPicker
          value={settings.modelSet}
          onChange={(modelSet) => updateSettings({ modelSet })}
          disabled={isAnalyzing}
        />
      </StatusBar>
    </div>
  )
}
