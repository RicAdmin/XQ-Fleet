import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string | ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={['ui-page-head', className].filter(Boolean).join(' ')}>
      <div>
        <h2 className="ui-page-title">{title}</h2>
        {description ? <p className="ui-page-desc">{description}</p> : null}
      </div>
      {actions ? <div className="ui-page-head__actions">{actions}</div> : null}
    </div>
  )
}
