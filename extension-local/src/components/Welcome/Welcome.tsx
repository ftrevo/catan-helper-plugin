import { CameraIcon, HexLogo } from '../Icons/Icons'
import './Welcome.css'

type WelcomeProps = {
  onCapture: () => void
  loading: boolean
}

export const Welcome = ({ onCapture, loading }: WelcomeProps) => (
  <section className="welcome">
    <div className="welcome-art">
      <HexLogo size={72} />
    </div>
    <h1 className="welcome-title">Read your board</h1>
    <p className="welcome-text">
      Open a game on <b>colonist.io</b> and capture it. Catan Helper recognises every tile in your browser and shows
      settlement values and production statistics.
    </p>
    <button
      type="button"
      className={`primary-button ${loading ? 'is-busy' : ''}`}
      onClick={onCapture}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" />
          Reading the board…
        </>
      ) : (
        <>
          <CameraIcon />
          Capture board
        </>
      )}
    </button>
    <p className="welcome-hint">
      Shortcut: <kbd>⌘</kbd>
      <kbd>⇧</kbd>
      <kbd>Y</kbd> opens this popup
    </p>
  </section>
)
