import { createFileRoute } from '@tanstack/react-router'

import { x402ApiGatewayResponse } from '#/lib/agent-commerce-discovery'

export const Route = createFileRoute('/api/')({
  server: {
    handlers: {
      GET: ({ request }) => x402ApiGatewayResponse(request),
    },
  },
})
