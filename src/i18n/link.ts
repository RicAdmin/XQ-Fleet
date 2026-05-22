import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'

/** Strip an optional leading locale segment from a pathname. */
export function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(en|ms|zh)(\/.*)?$/)
  if (!match) return pathname || '/'
  return match[2] || '/'
}

/** Build a locale-prefixed path, e.g. `/ms/about`. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (normalized === '/') return `/${locale}`
  return `/${locale}${normalized}`
}

/** Prefix path with locale unless already prefixed. */
export function withLocale(locale: Locale, path: string): string {
  if (/^\/(en|ms|zh)(\/|$)/.test(path)) return path
  return localePath(locale, path)
}

export function localeHref(locale: Locale, path: string): string {
  return localePath(locale, stripLocalePrefix(path))
}

export function defaultLocalePath(path: string): string {
  return localePath(DEFAULT_LOCALE, path)
}
