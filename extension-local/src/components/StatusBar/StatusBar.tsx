import './StatusBar.css'

type StatusBarProps = {
  capturedAt: number | undefined
}

const formatTime = (epochMs: number) =>
  new Date(epochMs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

/** Footer with the time of the last capture; hidden until a board has been read. */
export const StatusBar = ({ capturedAt }: StatusBarProps) =>
  capturedAt === undefined ? null : (
    <footer className="statusbar">
      <span className="statusbar-note">Captured {formatTime(capturedAt)}</span>
    </footer>
  )
