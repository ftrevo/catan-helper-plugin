import type { MouseEventHandler } from 'react'

import './TabHeader.css'

export type Tab = 'game' | 'statistics'

type TabHeaderProps = {
  onClickScreenshot: MouseEventHandler<HTMLButtonElement>
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export const TabHeader = ({ onClickScreenshot, activeTab, setActiveTab }: TabHeaderProps) => {
  return (
    <div className="tab-bar">
      <div className={`tab ${activeTab === 'game' ? 'tabSelected' : ''}`} onClick={() => setActiveTab('game')}>
        Game
      </div>
      <div
        className={`tab ${activeTab === 'statistics' ? 'tabSelected' : ''}`}
        onClick={() => setActiveTab('statistics')}
      >
        Statistics
      </div>
      <button onClick={onClickScreenshot}>Capture image</button>
    </div>
  )
}
