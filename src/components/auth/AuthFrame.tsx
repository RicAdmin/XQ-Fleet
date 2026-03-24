import type { ReactNode } from 'react'

type AuthFrameProps = {
  badge: string
  title: string
  description?: string
  asideTitle?: string
  asideBody?: string
  children: ReactNode
  footer?: ReactNode
  variant?: 'split' | 'compact'
}

export default function AuthFrame({
  badge,
  title,
  description,
  asideTitle,
  asideBody,
  children,
  footer,
  variant = 'split',
}: AuthFrameProps) {
  const hasAside = variant === 'split' && asideTitle && asideBody

  return (
    <section className={`auth-layout rise-in${variant === 'compact' ? ' is-compact' : ''}`}>
      {hasAside ? (
        <aside className="auth-aside island-shell">
          <p className="island-kicker mb-3">{badge}</p>
          <h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="m-0 max-w-xl text-base leading-7 text-[var(--sea-ink-soft)]">
              {description}
            </p>
          ) : null}

          <div className="auth-note mt-8 rounded-3xl border border-[var(--line)] bg-[rgba(255,255,255,0.45)] p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-[0.18em] text-[var(--kicker)] uppercase">
              {asideTitle}
            </h2>
            <p className="m-0 text-sm leading-7 text-[var(--sea-ink-soft)]">
              {asideBody}
            </p>
          </div>
        </aside>
      ) : null}

      <div className={`auth-card island-shell${variant === 'compact' ? ' is-compact' : ''}`}>
        <div className="auth-card-header">
          <p className="island-kicker mb-3">{badge}</p>
          <h1 className="display-title mb-0 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 text-sm leading-7 text-[var(--sea-ink-soft)]">{description}</p>
          ) : null}
        </div>
        {children}
        {footer ? <div className="mt-6 border-t border-[var(--line)] pt-5">{footer}</div> : null}
      </div>
    </section>
  )
}
