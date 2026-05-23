import { localeHref, stripLocalePrefix } from '#/i18n/link'
import type { Locale } from '#/i18n/locales'

/** Routes that live outside the /$locale public tree. */
const NON_LOCALE_PREFIXED = /^\/(account|app|admin|internal)(\/|$)/

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return '/account'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

/** Post-auth destination path (relative). */
export function authReturnPath(locale: Locale, path = '/account'): string {
  const normalized = normalizePath(path)

  if (NON_LOCALE_PREFIXED.test(normalized)) {
    return normalized
  }

  if (/^\/(en|ms|zh)(\/|$)/.test(normalized)) {
    const stripped = stripLocalePrefix(normalized)
    if (NON_LOCALE_PREFIXED.test(stripped)) {
      return stripped
    }
    return normalized
  }

  return localeHref(locale, normalized)
}

/**
 * Better Auth verification callback — lands on locale login so errors render there,
 * while successful verification still reaches /account via redirectAuthenticatedUser.
 */
export function authVerifyCallbackPath(locale: Locale, returnTo = '/account'): string {
  const destination = authReturnPath(locale, returnTo)
  const loginPath = localeHref(locale, '/login')
  return `${loginPath}?${new URLSearchParams({ returnTo: destination })}`
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
