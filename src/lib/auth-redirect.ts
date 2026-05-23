import { localeHref } from '#/i18n/link'
import type { Locale } from '#/i18n/locales'

/** Locale-prefixed in-app path for post-auth redirects. */
export function authReturnPath(locale: Locale, path = '/account'): string {
  const trimmed = path.trim()
  if (!trimmed) return localeHref(locale, '/account')
  return localeHref(locale, trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
}

/** Absolute URL for Better Auth `redirectTo` fields. */
export function authReturnUrl(locale: Locale, path = '/account'): string {
  const pathname = authReturnPath(locale, path)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${pathname}`
  }
  const base = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${pathname}`
}

/** Navigate after auth — handles locale paths and query strings reliably. */
export function redirectAfterAuth(destination: string) {
  window.location.assign(destination)
}
