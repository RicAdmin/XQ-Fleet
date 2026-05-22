import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { LegalDocumentContent } from '#/components/legal/LegalDocumentContent'
import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import { LEGAL_COMPANY, LEGAL_PACK_INTRO } from '#/lib/legal/company'
import { LEGAL_NAV_LINKS } from '#/lib/legal'
import type { LegalDocument, LegalLocaleContent } from '#/lib/legal/types'

type LegalDocumentPageProps = {
  document: LegalDocument
}

const defaultLocale: LegalLocaleContent = {
  code: 'en',
  label: 'English',
  title: '',
  documentLabel: '',
  sections: [],
}

function resolveLocale(document: LegalDocument, code: string): LegalLocaleContent {
  if (code === 'en') {
    return {
      code: 'en',
      label: 'English',
      title: document.title,
      documentLabel: document.documentLabel,
      sections: document.sections,
    }
  }

  return document.locales?.find((locale) => locale.code === code) ?? defaultLocale
}

export function LegalDocumentPage({ document }: LegalDocumentPageProps) {
  const [localeCode, setLocaleCode] = useState('en')
  const hasLocales = Boolean(document.locales?.length)
  const locale = resolveLocale(document, localeCode)
  const companyIntro = locale.companyIntro ?? LEGAL_PACK_INTRO
  const footerText =
    locale.footerText ??
    `Questions? Contact ${LEGAL_COMPANY.name} at ${LEGAL_COMPANY.address}. Website: ${LEGAL_COMPANY.website}`

  return (
    <PublicMarketingShell screenLabel={locale.title} mainClassName="container legal-page-main">
      <article className="legal-page">
        <header className="legal-page-header">
          <span className="eyebrow">XQ Car Rental · Legal</span>
          <h1 className="h-section">{locale.title}</h1>
          <p className="legal-meta">
            {locale.documentLabel} · {localeCode === 'ms' ? 'Kuat kuasa' : 'Effective'} {document.effectiveDate} ·{' '}
            {localeCode === 'ms' ? 'Versi' : 'Version'} {document.version}
          </p>
          <div className="legal-company-block">
            {companyIntro.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </header>

        {hasLocales ? (
          <nav className="legal-lang-nav" aria-label="Document language">
            <button
              type="button"
              className={localeCode === 'en' ? 'legal-lang-btn is-active' : 'legal-lang-btn'}
              onClick={() => setLocaleCode('en')}
            >
              English
            </button>
            {document.locales!.map((item) => (
              <button
                key={item.code}
                type="button"
                className={localeCode === item.code ? 'legal-lang-btn is-active' : 'legal-lang-btn'}
                onClick={() => setLocaleCode(item.code)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        ) : null}

        <nav className="legal-nav" aria-label="Related legal documents">
          {LEGAL_NAV_LINKS.map((link) => (
            <Link
              key={link.slug}
              to={link.path}
              className={link.slug === document.slug ? 'legal-nav-link is-active' : 'legal-nav-link'}
            >
              {link.label}
            </Link>
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
