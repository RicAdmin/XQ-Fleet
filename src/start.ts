import { createMiddleware, createStart } from '@tanstack/react-start'

import { wellKnownDiscoveryResponse } from '#/lib/agent-discovery.server'

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

export const startInstance = createStart(() => ({
  requestMiddleware: [wellKnownDiscoveryMiddleware],
}))
