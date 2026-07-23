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
    defaultPreloadStaleTime: 0,
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
