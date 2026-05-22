import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'

import { localeHref } from '#/i18n/link'
import type { Locale } from '#/i18n/locales'
import { HTML_LANG } from '#/i18n/locales'
import type { TranslateFn } from '#/i18n/translate'
import { translate } from '#/i18n/translate'

type I18nContextValue = {
  locale: Locale
  htmlLang: string
  t: TranslateFn
  localeHref: (path: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const t = useCallback<TranslateFn>((key, vars) => translate(locale, key, vars), [locale])
  const href = useCallback((path: string) => localeHref(locale, path), [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      htmlLang: HTML_LANG[locale],
      t,
      localeHref: href,
    }),
    [locale, t, href],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}

export function useLocale(): Locale {
  return useI18n().locale
}

export function useT(): TranslateFn {
  return useI18n().t
}

export function useLocaleHref(): (path: string) => string {
  return useI18n().localeHref
}

/** Safe hook for components that may render outside locale layout (e.g. admin). */
export function useOptionalI18n(): I18nContextValue | null {
  return useContext(I18nContext)
}
