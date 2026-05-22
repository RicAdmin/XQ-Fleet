import { AlertTriangle, RefreshCw } from 'lucide-react'

type ErrorPanelProps = {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorPanel({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorPanelProps) {
  return (
    <div
      className={['error-panel', className].filter(Boolean).join(' ')}
      role="alert"
    >
      <div className="error-panel-icon">
        <AlertTriangle size={20} />
      </div>
      <div className="error-panel-body">
        <p className="error-panel-title">{title}</p>
        {message && <p className="error-panel-message">{message}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          className="button-secondary inline-flex items-center gap-1.5"
          onClick={onRetry}
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  )
}
