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
  actions?: ReactNode
  backLink?: PageHeaderBackLink
  variant?: 'default' | 'detail'
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  backLink,
  variant = 'default',
  className,
}: PageHeaderProps) {
  const isDetail = variant === 'detail'

  if (isDetail) {
    return (
      <div className={cn('mb-3.5', className)}>
        {backLink ? (
          <Link
            to={backLink.to}
            className="ui-back-link mb-1 inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-semibold text-[var(--sea-ink)] no-underline hover:text-[var(--lagoon-deep)]"
          >
            <ArrowLeft size={14} strokeWidth={2.5} className="shrink-0" />
            {backLink.label}
          </Link>
        ) : null}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0 flex-1">
            <h2 className="ui-page-title font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-[var(--sea-ink)]">
              {title}
            </h2>
            {description ? (
              <div className="ui-page-desc mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.8125rem] leading-snug text-[var(--sea-ink-soft)]">
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
    <div
      className={cn(
        'ui-page-head mb-4 flex flex-wrap items-start justify-between gap-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className="ui-page-title font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--sea-ink)]">
          {title}
        </h2>
        {description ? (
          <div className="ui-page-desc mt-1 text-sm text-[var(--sea-ink-soft)]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="ui-page-head__actions flex flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
