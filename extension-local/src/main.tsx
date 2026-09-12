import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { createBoardAnalyzer } from './app/boardAnalyzer'
import { captureFixtureScreenshot } from './mocks/devScreenshot'
import { createAnalysisStore } from './platform/analysisStore'
import { decodeDataUrl } from './platform/decodeImage'
import { assetUrl, isExtensionRuntime } from './platform/runtime'
import { captureActiveTab } from './platform/screenshot'
import { createSettingsStore } from './platform/settingsStore'
import './index.css'

/**
 * Composition root. The only place that knows whether we run inside Chrome (real screenshots) or in the
 * Vite dev server (a fixture screenshot); everything else is wired identically.
 */
const analyzer = createBoardAnalyzer({
  captureScreenshot: isExtensionRuntime() ? () => captureActiveTab().then(decodeDataUrl) : captureFixtureScreenshot,
  resolveModelUrl: assetUrl,
})

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element')

createRoot(container).render(
  <StrictMode>
    <App analyzer={analyzer} analysisStore={createAnalysisStore()} settingsStore={createSettingsStore()} />
  </StrictMode>
)
