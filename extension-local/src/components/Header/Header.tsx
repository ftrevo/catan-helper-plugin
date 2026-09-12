import { HexLogo, RefreshIcon } from '../Icons/Icons'
import './Header.css'

type HeaderProps = {
  /** Shown when a board is loaded; captures again. */
  onRefresh: (() => void) | undefined
  refreshing: boolean
}

export const Header = ({ onRefresh, refreshing }: HeaderProps) => (
  <header className="header">
    <div className="header-brand">
      <HexLogo />
      <span className="header-title">Catan Helper</span>
    </div>
    {onRefresh && (
      <button
        type="button"
        className={`icon-button ${refreshing ? 'is-busy' : ''}`}
        onClick={onRefresh}
        disabled={refreshing}
        title="Capture the board again (⌘⇧Y)"
        aria-label="Capture the board again"
      >
        <RefreshIcon />
      </button>
    )}
  </header>
)
