import './TabHeader.css'

export type Tab = 'board' | 'statistics'

type TabHeaderProps = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  /** Board and refresh controls only make sense once a board has been read. */
  showControls: boolean
  rarityMode: boolean
  onRarityModeChange: (enabled: boolean) => void
  onRefresh: () => void
  refreshing: boolean
}

export const TabHeader = ({
  activeTab,
  onTabChange,
  showControls,
  rarityMode,
  onRarityModeChange,
  onRefresh,
  refreshing,
}: TabHeaderProps) => (
  <nav className="tab-bar">
    <button className={`tab ${activeTab === 'board' ? 'tab-selected' : ''}`} onClick={() => onTabChange('board')}>
      Board
    </button>
    <button
      className={`tab ${activeTab === 'statistics' ? 'tab-selected' : ''}`}
      onClick={() => onTabChange('statistics')}
    >
      Statistics
    </button>

    {showControls && (
      <>
        <button
          className={`toggle-button ${rarityMode ? 'rarity' : 'sum'}`}
          onClick={() => onRarityModeChange(!rarityMode)}
          title={rarityMode ? 'Vertex values weighted by resource rarity' : 'Vertex values as plain pip sums'}
        >
          <span className="toggle-inner">
            <span className="toggle-option toggle-sum">Sum</span>
            <span className="toggle-option toggle-rarity">Rarity</span>
          </span>
        </button>
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing} title="Capture the board again">
          <svg className="refresh-icon" viewBox="0 0 512 512" aria-hidden="true">
            <path
              fill="white"
              d="M386.3 160L336 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l128 0c17.7 0 32-14.3 32-32l0-128c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 51.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0s-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3s163.8-62.5 226.3 0L386.3 160z"
            />
          </svg>
        </button>
      </>
    )}
  </nav>
)
