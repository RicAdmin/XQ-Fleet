/**
 * Helpers for the `aff_ref` HttpOnly cookie used by Phase 3 affiliate
 * attribution.
 *
 * Behaviour:
 * - 30-day TTL (sliding — refreshed on every visit that sets the cookie).
 * - `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` only in production.
 * - Last-click wins: any subsequent `?ref=` or `/r/$code` visit overwrites the
 *   previous value.
 * - Client JavaScript can NOT read it (cookie is read on the server inside
 *   `createPortalBooking` to record attribution).
 */

const AFF_REF_COOKIE_NAME = 'aff_ref'
const AFF_REF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export type AffiliateCookieOptions = {
  /** Override defaults; primarily for tests. */
  maxAge?: number
}

export async function readAffiliateRefCookie(): Promise<string | null> {
  const { getCookie } = await import('@tanstack/react-start/server')
  const raw = getCookie(AFF_REF_COOKIE_NAME)
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Defence-in-depth: enforce the same character class as
  // `affiliateCodeSchema` in admin-schemas.ts.
  if (!/^[a-z0-9_-]{3,32}$/.test(trimmed)) return null
  return trimmed
}

export async function writeAffiliateRefCookie(
  code: string,
  opts: AffiliateCookieOptions = {},
): Promise<void> {
  const { setCookie } = await import('@tanstack/react-start/server')
  setCookie(AFF_REF_COOKIE_NAME, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: opts.maxAge ?? AFF_REF_MAX_AGE_SECONDS,
    path: '/',
  })
}

export async function clearAffiliateRefCookie(): Promise<void> {
  const { setCookie } = await import('@tanstack/react-start/server')
  setCookie(AFF_REF_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })
}

export const AFFILIATE_COOKIE_INTERNALS = {
  name: AFF_REF_COOKIE_NAME,
  maxAgeSeconds: AFF_REF_MAX_AGE_SECONDS,
} as const
