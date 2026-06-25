import { createFileRoute } from '@tanstack/react-router'

import { apiCatalogResponse } from '#/lib/agent-discovery'

export const Route = createFileRoute('/well-known/api-catalog')({
  server: {
    handlers: {
      GET: () => apiCatalogResponse(),
    },
  },
})
