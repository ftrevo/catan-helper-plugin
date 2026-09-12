import { useMemo, useState } from 'react'
import { type BoardAnalyzer } from './app/boardAnalyzer'
import { useBoardAnalysis } from './app/useBoardAnalysis'
import { useSettings } from './app/useSettings'
import { BoardView } from './components/Board/BoardView'
import { ModelPicker } from './components/ModelPicker/ModelPicker'
import { Notice } from './components/Notice/Notice'
import { Statistics } from './components/Statistics/Statistics'
import { type Tab, TabHeader } from './components/TabHeader/TabHeader'
import { Welcome } from './components/Welcome/Welcome'
import { boardWarnings, scarcityFactors } from './domain'
import { type AnalysisStore } from './platform/analysisStore'
import { type SettingsStore } from './platform/settingsStore'

type AppProps = {
  analyzer: BoardAnalyzer
  analysisStore: AnalysisStore
  settingsStore: SettingsStore
}

/** Every tile but the desert carries a number token. */
const EXPECTED_TOKENS = 18

const formatTime = (epochMs: number) =>
  new Date(epochMs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

export const App = ({ analyzer, analysisStore, settingsStore }: AppProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('board')
  const [rarityMode, setRarityMode] = useState(false)
  const [settings, updateSettings] = useSettings(settingsStore)
  const { analysis, isAnalyzing, error, analyze } = useBoardAnalysis(analyzer, analysisStore, settings.modelSet)

  const reading = analysis?.reading
  const board = reading?.board
  const warnings = useMemo(() => {
    if (!reading) return []
    const found = reading.location.tokensFound
    const partial = found < EXPECTED_TOKENS ? [`Only ${found} of ${EXPECTED_TOKENS} number tokens were found.`] : []
    return [...partial, ...boardWarnings(reading.board)]
  }, [reading])
  const scarcity = useMemo(() => (board && rarityMode ? scarcityFactors(board) : undefined), [board, rarityMode])

  return (
    <div className="app">
      <TabHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showControls={board !== undefined}
        rarityMode={rarityMode}
        onRarityModeChange={setRarityMode}
        onRefresh={analyze}
        refreshing={isAnalyzing}
      />

      {error && <Notice tone="error">{error}</Notice>}
      {warnings.map((warning) => (
        <Notice key={warning} tone="warning">
          {warning} Try capturing again with the whole board visible.
        </Notice>
      ))}

      <main className="tab-content">
        {!board && <Welcome onCapture={analyze} loading={isAnalyzing} />}
        {board && activeTab === 'board' && <BoardView board={board} scarcity={scarcity} />}
        {board && activeTab === 'statistics' && <Statistics board={board} />}
      </main>

      <footer className="status-line">
        <ModelPicker
          value={settings.modelSet}
          onChange={(modelSet) => updateSettings({ modelSet })}
          disabled={isAnalyzing}
        />
        {analysis && (
          <span>
            Captured at {formatTime(analysis.capturedAt)} with {analysis.modelSet}
          </span>
        )}
      </footer>
    </div>
  )
}
