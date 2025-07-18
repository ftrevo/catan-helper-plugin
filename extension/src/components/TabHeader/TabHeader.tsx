import type { MouseEventHandler } from 'react'

import './TabHeader.css'

export type Tab = 'game' | 'statistics'

type TabHeaderProps = {
  onClickScreenshot: MouseEventHandler<HTMLButtonElement>
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  rarity: boolean
  setRarity: (value: boolean) => void
}

export const TabHeader = ({ onClickScreenshot, activeTab, setActiveTab, rarity, setRarity }: TabHeaderProps) => {
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
      Rarity
      <label className="switch">
        <input
          type="checkbox"
          key="building-toggle"
          checked={rarity}
          onChange={() => setRarity(!rarity)}
          className="toggle"
        />
        <span className="slider round"></span>
      </label>
      <button onClick={onClickScreenshot}>Capture image</button>
    </div>
  )
}
