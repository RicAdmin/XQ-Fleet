/** Public path to the XQ Car brand logo (served from `public/image/`). */
export const BRAND_NAME = 'XQCar'
export const BRAND_NAME_PROSE = 'XQ Car'
export const BRAND_LOGO_PATH = '/image/xqCarLogo.png'

function resolveSiteUrl(siteUrl?: string): string {
  const raw =
    siteUrl ??
    import.meta.env.VITE_SITE_URL ??
    process.env.SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}

import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'
import { localePath } from '#/i18n/link'

/** Normalized public origin, e.g. https://car.xqholidays.com.my */
export function publicSiteUrl(siteUrl?: string): string {
  return resolveSiteUrl(siteUrl)
}

/**
 * Origin used for iPay88 ResponseURL / BackendURL.
 * In local dev, set DEV_TUNNEL_URL to your ngrok HTTPS URL — iPay88 does not accept localhost.
 */
export function paymentCallbackSiteUrl(siteUrl?: string): string {
  const tunnel = process.env.DEV_TUNNEL_URL?.trim().replace(/\/$/, '')
  if (tunnel && process.env.NODE_ENV !== 'production') {
    return tunnel
  }
  return publicSiteUrl(siteUrl)
}

/** Absolute public URL for payment gateway callbacks. */
export function paymentCallbackPath(path: string, siteUrl?: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${paymentCallbackSiteUrl(siteUrl)}${normalizedPath}`
}

/** Absolute public URL for a site path — avoids double slashes when env vars trail with `/`. */
export function publicSitePath(path: string, siteUrl?: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${publicSiteUrl(siteUrl)}${normalizedPath}`
}

/** Locale-aware absolute URL, e.g. https://carxq.com/ms/about */
export function publicLocalePath(path: string, locale: Locale = DEFAULT_LOCALE, siteUrl?: string): string {
  return publicSitePath(localePath(locale, path), siteUrl)
}

/** Absolute URL for email clients and external links. */
export function brandLogoUrl(siteUrl?: string): string {
  return publicSitePath(BRAND_LOGO_PATH, siteUrl)
}

/**
 * Email clients require fully qualified image URLs.
 * DB values may be absolute (R2) or site-relative (/image/...).
 */
export function absolutePublicUrl(
  url: string | null | undefined,
  siteUrl?: string,
): string | null {
  const trimmed = url?.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return publicSitePath(path, siteUrl)
}

/** Filesystem path for server-side PDF generation. */
export function brandLogoPathFromCwd(): string {
  return `${process.cwd()}/public/image/xqCarLogo.png`
}
