import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string | ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={`mb-6 flex items-start justify-between gap-4 ${className ?? ''}`}>
      <div>
        <h2
          className="text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--sea-ink)' }}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm" style={{ color: 'var(--sea-ink-soft)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
