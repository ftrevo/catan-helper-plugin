import { type ReactNode } from 'react'
import './StatusBar.css'

type StatusBarProps = {
  /** Left slot: settings such as the model picker. */
  children: ReactNode
  capturedAt: number | undefined
  modelSet: string | undefined
}

const formatTime = (epochMs: number) =>
  new Date(epochMs).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

export const StatusBar = ({ children, capturedAt, modelSet }: StatusBarProps) => (
  <footer className="statusbar">
    {children}
    {capturedAt !== undefined && (
      <span className="statusbar-note">
        Captured {formatTime(capturedAt)}
        {modelSet ? ` · ${modelSet}` : ''}
      </span>
    )}
  </footer>
)
