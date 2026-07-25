import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { cn } from '#/lib/utils'

interface PageHeaderBackLink {
  to: string
  label: string
}

interface PageHeaderProps {
  title: string
  description?: string | ReactNode
  kicker?: string
  actions?: ReactNode
  backLink?: PageHeaderBackLink
  variant?: 'default' | 'detail'
  className?: string
}

export function PageHeader({
  title,
  description,
  kicker,
  actions,
  backLink,
  variant = 'default',
  className,
}: PageHeaderProps) {
  const isDetail = variant === 'detail'

  if (isDetail) {
    return (
      <div className={cn('ui-page-head ui-page-head--detail', className)}>
        {backLink ? (
          <Link
            to={backLink.to}
            className="ui-back-link inline-flex w-fit items-center gap-1.5 no-underline"
          >
            <ArrowLeft size={13} strokeWidth={2.5} className="shrink-0" />
            {backLink.label}
          </Link>
        ) : null}
        <div className="ui-page-head__row flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="ui-page-head__main min-w-0 flex-1">
            {kicker ? <p className="island-kicker mb-1">{kicker}</p> : null}
            <h2 className="ui-page-title font-semibold text-[var(--sea-ink)]">
              {title}
            </h2>
            {description ? (
              <div className="ui-page-desc flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[var(--sea-ink-soft)]">
                {description}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div className="ui-page-head__actions flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('ui-page-head flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0 flex-1">
        {kicker ? <p className="island-kicker mb-1">{kicker}</p> : null}
        <div className="ui-page-head__title-row">
          <h2 className="ui-page-title font-semibold text-[var(--sea-ink)]">{title}</h2>
          {description ? (
            <div className="ui-page-desc text-[var(--sea-ink-soft)]">{description}</div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="ui-page-head__actions flex flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
