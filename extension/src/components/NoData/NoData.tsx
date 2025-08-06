import './NoData.css'

type NoDataProps = {
  onCapture: () => void
  loading: boolean
}

export const NoData = ({ onCapture, loading }: NoDataProps) => (
  <div className="no-data-container">
    <h2 className="no-data-title">👋 Hello!</h2>
    <p className="no-data-description">
      Catan Helper analyzes your <b>colonist.io</b> board and gives you instant statistics and insights for smarter
      gameplay.
    </p>
    {loading ? (
      <p className="no-data-loading">Please wait, processing...</p>
    ) : (
      <button className="no-data-capture-btn" onClick={onCapture} disabled={loading}>
        Capture Screenshot
      </button>
    )}
    <footer className="no-data-footer">
      <span>Created by </span>
      <a className="no-data-footer-link" href="https://github.com/ftrevo" target="_blank" rel="noopener noreferrer">
        @ftrevo
      </a>
    </footer>
  </div>
)
