import { describe, expect, it } from 'vitest'

import {
  DOCUMENT_CSP_REPORT_ONLY,
  DOCUMENT_SECURITY_HEADERS,
  applyDocumentSecurityHeaders,
} from '#/lib/document-security-headers'

describe('document security headers', () => {
  it('includes HSTS with includeSubDomains and preload', () => {
    expect(DOCUMENT_SECURITY_HEADERS['Strict-Transport-Security']).toContain(
      'includeSubDomains',
    )
    expect(DOCUMENT_SECURITY_HEADERS['Strict-Transport-Security']).toContain('preload')
  })

  it('denies framing and sets opener policy compatible with auth popups', () => {
    expect(DOCUMENT_SECURITY_HEADERS['X-Frame-Options']).toBe('DENY')
    expect(DOCUMENT_SECURITY_HEADERS['Cross-Origin-Opener-Policy']).toBe(
      'same-origin-allow-popups',
    )
  })

  it('applies headers onto a Headers instance', () => {
    const headers = new Headers()
    applyDocumentSecurityHeaders(headers)
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('ships a report-only CSP that allows GA and https images', () => {
    expect(DOCUMENT_CSP_REPORT_ONLY).toContain('Content-Security-Policy'.slice(0, 0) + "default-src 'self'")
    expect(DOCUMENT_CSP_REPORT_ONLY).toContain('googletagmanager.com')
    expect(DOCUMENT_CSP_REPORT_ONLY).toContain("img-src 'self' data: blob: https:")
  })
})
