import './Welcome.css'

type WelcomeProps = {
  onCapture: () => void
  loading: boolean
}

export const Welcome = ({ onCapture, loading }: WelcomeProps) => (
  <section className="welcome">
    <h2 className="welcome-title">👋 Hello!</h2>
    <p className="welcome-description">
      Catan Helper reads your <b>colonist.io</b> board and gives you instant statistics and insights for smarter
      gameplay. Everything runs in your browser.
    </p>
    {loading ? (
      <p className="welcome-loading">Reading the board…</p>
    ) : (
      <button className="welcome-capture-btn" onClick={onCapture}>
        Capture board
      </button>
    )}
    <footer className="welcome-footer">
      <span>Created by </span>
      <a className="welcome-footer-link" href="https://github.com/ftrevo" target="_blank" rel="noopener noreferrer">
        @ftrevo
      </a>
    </footer>
  </section>
)
