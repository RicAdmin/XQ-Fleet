import { useRouterState } from '@tanstack/react-router'
import { Compass } from 'lucide-react'
import { Suspense, use, useEffect } from 'react'

import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import { I18nProvider, useT } from '#/i18n/context'
import { DEFAULT_LOCALE, isLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'
import { ensureMessages } from '#/i18n/messages'

function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split('/').filter(Boolean)[0]
  return segment && isLocale(segment) ? segment : DEFAULT_LOCALE
}

function NotFoundContent() {
  const t = useT()

  useEffect(() => {
    document.title = t('notFound.documentTitle')
  }, [t])

  return (
    <PublicMarketingShell
      screenLabel={t('notFound.screenLabel')}
      mainClassName="not-found-page"
    >
      <section className="not-found-stage" aria-labelledby="not-found-heading">
        <div className="not-found-mark" aria-hidden>
          <Compass size={28} strokeWidth={1.75} />
        </div>
        <p className="eyebrow not-found-eyebrow">{t('notFound.eyebrow')}</p>
        <h1 id="not-found-heading" className="not-found-title">
          {t('notFound.title')}
        </h1>
        <p className="not-found-copy">{t('notFound.body')}</p>
        <div className="not-found-actions">
          <LocaleLink to="/" className="btn btn-leaf">
            {t('notFound.homeCta')}
          </LocaleLink>
          <LocaleLink to="/blog" className="btn btn-ghost">
            {t('notFound.journalCta')}
          </LocaleLink>
          <LocaleLink to="/" hash="booking-dock" className="btn btn-ghost">
            {t('notFound.searchCta')}
          </LocaleLink>
        </div>
      </section>
    </PublicMarketingShell>
  )
}

function NotFoundLocaleGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const locale = localeFromPathname(pathname)
  // Locale layout beforeLoad is skipped for root notFound; load catalogs here.
  use(ensureMessages(locale))

  return (
    <I18nProvider locale={locale}>
      <NotFoundContent />
    </I18nProvider>
  )
}

/** Root-level 404 — works with or without a locale layout above it. */
export function NotFoundPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundLocaleGate />
    </Suspense>
  )
}
