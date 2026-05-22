import { useMemo } from 'react'

import { LegalDocumentContent } from '#/components/legal/LegalDocumentContent'
import { LocaleLink } from '#/components/i18n/LocaleLink'
import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import { useLocale, useT } from '#/i18n/context'
import type { Locale } from '#/i18n/locales'
import { LEGAL_COMPANY, LEGAL_PACK_INTRO } from '#/lib/legal/company'
import { LEGAL_NAV_LINKS } from '#/lib/legal'
import type { LegalDocument, LegalDocumentSlug, LegalLocaleContent } from '#/lib/legal/types'

type LegalDocumentPageProps = {
  document: LegalDocument
}

const LEGAL_NAV_LABEL: Record<LegalDocumentSlug, 'footer.terms' | 'footer.rentalContract' | 'footer.privacy' | 'footer.refund' | 'footer.pdpa'> = {
  terms: 'footer.terms',
  'rental-agreement': 'footer.rentalContract',
  privacy: 'footer.privacy',
  'refund-policy': 'footer.refund',
  pdpa: 'footer.pdpa',
}

function resolveLocale(document: LegalDocument, siteLocale: Locale): LegalLocaleContent {
  if (siteLocale === 'en') {
    return {
      code: 'en',
      label: 'English',
      title: document.title,
      documentLabel: document.documentLabel,
      sections: document.sections,
    }
  }

  const localized = document.locales?.find((item) => item.code === siteLocale)
  if (localized) return localized

  return {
    code: 'en',
    label: 'English',
    title: document.title,
    documentLabel: document.documentLabel,
    sections: document.sections,
  }
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const siteLocale = useLocale()
  const t = useT()
  const locale = useMemo(() => resolveLocale(document, siteLocale), [document, siteLocale])
  const companyIntro = locale.companyIntro ?? LEGAL_PACK_INTRO
  const footerText =
    locale.footerText ??
    `${t('legal.questions')} ${LEGAL_COMPANY.name} at ${LEGAL_COMPANY.address}. Website: ${LEGAL_COMPANY.website}`

  return (
    <PublicMarketingShell screenLabel={locale.title} mainClassName="container legal-page-main">
      <article className="legal-page">
        <header className="legal-page-header">
          <span className="eyebrow">{t('legal.packIntro')}</span>
          <h1 className="h-section">{locale.title}</h1>
          <p className="legal-meta">
            {locale.documentLabel} · {siteLocale === 'ms' ? t('legal.effectiveMs') : t('legal.effective')}{' '}
            {document.effectiveDate} · {siteLocale === 'ms' ? t('legal.versionMs') : t('legal.version')}{' '}
            {document.version}
          </p>
          <div className="legal-company-block">
            {companyIntro.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </header>

        <nav className="legal-nav" aria-label={t('legal.relatedDocs')}>
          {LEGAL_NAV_LINKS.map((link) => (
            <LocaleLink
              key={link.slug}
              to={link.path}
              className={link.slug === document.slug ? 'legal-nav-link is-active' : 'legal-nav-link'}
            >
              {t(LEGAL_NAV_LABEL[link.slug])}
            </LocaleLink>
          ))}
        </nav>

        <div className="legal-body" lang={locale.code}>
          <LegalDocumentContent sections={locale.sections} />
        </div>

        <footer className="legal-page-footer">
          <p>{footerText}</p>
        </footer>
      </article>
    </PublicMarketingShell>
  )
}
