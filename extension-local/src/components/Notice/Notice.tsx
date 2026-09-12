import './Notice.css'

type NoticeProps = {
  tone: 'error' | 'warning'
  children: React.ReactNode
}

export const Notice = ({ tone, children }: NoticeProps) => (
  <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
    {children}
  </div>
)
