import type { MouseEventHandler } from 'react'

import './TabHeader.css'

export type Tab = 'game' | 'statistics'

type TabHeaderProps = {
  onClickScreenshot: MouseEventHandler<HTMLButtonElement>
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  rarity: boolean
  setRarity: (value: boolean) => void
  hideButtons?: boolean
}

export const TabHeader = ({
  onClickScreenshot,
  activeTab,
  setActiveTab,
  rarity,
  setRarity,
  hideButtons,
}: TabHeaderProps) => {
  return (
    <div className="tab-bar">
      <div className={`tab ${activeTab === 'game' ? 'tab-selected' : ''}`} onClick={() => setActiveTab('game')}>
        Game
      </div>
      <div
        className={`tab ${activeTab === 'statistics' ? 'tab-selected' : ''}`}
        onClick={() => setActiveTab('statistics')}
      >
        Statistics
      </div>
      {!hideButtons && (
        <div className={`toggle-button ${rarity ? 'rarity' : 'sum'}`} onClick={() => setRarity(!rarity)}>
          <div className="toggle-inner">
            <div className="toggle-option toggle-sum">Sum</div>
            <div className="toggle-option toggle-rarity">Rarity</div>
          </div>
        </div>
      )}
      {!hideButtons && (
        <button className="refresh-btn" onClick={onClickScreenshot}>
          <svg className="refresh-icon" viewBox="0 0 512 512">
            <path
              fill="white"
              d="M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
