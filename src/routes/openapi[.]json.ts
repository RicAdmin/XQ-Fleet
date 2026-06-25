import { createFileRoute } from '@tanstack/react-router'

import { openApiCommerceResponse } from '#/lib/agent-commerce-discovery'

export const Route = createFileRoute('/openapi.json')({
  server: {
    handlers: {
      GET: () => openApiCommerceResponse(),
    },
  },
})
