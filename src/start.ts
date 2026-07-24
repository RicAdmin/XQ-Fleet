import { createMiddleware, createStart } from '@tanstack/react-start'

import { wellKnownDiscoveryResponse } from '#/lib/agent-discovery.server'
import {
  applyDocumentSecurityHeaders,
  DOCUMENT_CSP_REPORT_ONLY,
} from '#/lib/document-security-headers'

/**
 * Serve RFC 8615 `/.well-known/*` discovery documents even when CDN rewrites fail.
 * Handlers also exist at `/well-known/*`; this short-circuits the dotted path.
 */
const wellKnownDiscoveryMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ request, next }) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return next()
    }

    const { pathname } = new URL(request.url)
    if (!pathname.startsWith('/.well-known')) {
      return next()
    }

    const response = wellKnownDiscoveryResponse(pathname)
    if (!response) {
      return next()
    }

    if (request.method === 'HEAD') {
      return new Response(null, {
        status: response.status,
        headers: response.headers,
      })
    }

    return response
  },
)

/**
 * Apply security headers to SSR HTML responses. Static assets already get
 * matching rules from netlify.toml; Lighthouse audits the document response.
 */
const documentSecurityHeadersMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    const result = await next()
    const response = result.response
    if (!response) return result

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) {
      return result
    }

    applyDocumentSecurityHeaders(response.headers)
    response.headers.set('Content-Security-Policy-Report-Only', DOCUMENT_CSP_REPORT_ONLY)
    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [wellKnownDiscoveryMiddleware, documentSecurityHeadersMiddleware],
}))
