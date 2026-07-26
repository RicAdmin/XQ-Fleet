import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { NotFoundPage } from '#/components/NotFoundPage'
import { rewriteWellKnownUrl } from '#/lib/well-known-path'
import { routeTree } from './routeTree.gen'

import { getContext } from './integrations/tanstack-query/root-provider'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    context: getContext(),

    scrollRestoration: true,
    defaultPreload: 'intent',
    // Keep admin beforeLoad results warm so sidebar hover/nav does not re-hit the DB every time.
    // Auth redirects must never be sticky — guards skip redirect on preload (see route-guards).
    defaultPreloadStaleTime: 60_000,
    defaultPendingMs: 120,
    defaultPendingMinMs: 200,
    defaultNotFoundComponent: NotFoundPage,
    rewrite: {
      // Netlify + TanStack serve handlers at /well-known/*; scanners request /.well-known/*.
      input: ({ url }) => rewriteWellKnownUrl(url),
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
