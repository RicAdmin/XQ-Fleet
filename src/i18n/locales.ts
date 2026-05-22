export const LOCALES = ['en', 'ms', 'zh'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_STORAGE_KEY = 'cxq-locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia',
  zh: '中文',
}

export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  ms: 'ms',
  zh: 'zh-Hans',
}

export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_MY',
  ms: 'ms_MY',
  zh: 'zh_CN',
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function parseLocale(value: string | undefined): Locale {
  if (value && isLocale(value)) return value
  return DEFAULT_LOCALE
}

export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const lower = acceptLanguage.toLowerCase()
  if (lower.includes('zh')) return 'zh'
  if (lower.includes('ms') || lower.includes('my')) return 'ms'
  return DEFAULT_LOCALE
}
