import './NoData.css'

export const NoData = ({ onCapture }: { onCapture: () => void }) => (
  <div className="no-data-container">
    <h2 className="no-data-title">👋 Hello!</h2>
    <p className="no-data-description">
      Catan Helper analyzes your <b>colonist.io</b> board and gives you instant statistics and insights for smarter
      gameplay.
    </p>
    <button className="no-data-capture-btn" onClick={onCapture}>
      Capture Screenshot
    </button>
    <footer className="no-data-footer">
      Created by{' '}
      <a href="https://github.com/ftrevo" target="_blank" rel="noopener noreferrer">
        @ftrevo
      </a>
    </footer>
  </div>
)
