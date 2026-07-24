/**
 * Security headers for SSR HTML documents.
 * Mirrors netlify.toml /* rules and uses COOP that allows auth popups.
 */

export const DOCUMENT_SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Allow Better Auth / OAuth popups during login.
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

/**
 * Report-Only CSP — collect violations before enforce.
 * Includes GA, self assets, R2 images (https:), and inline theme/JSON-LD via unsafe-inline
 * until nonce plumbing lands.
 */
export const DOCUMENT_CSP_REPORT_ONLY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https:",
  "form-action 'self' https:",
].join('; ')

export function applyDocumentSecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(DOCUMENT_SECURITY_HEADERS)) {
    headers.set(key, value)
  }
}
