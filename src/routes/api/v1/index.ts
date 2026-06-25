import { createFileRoute } from '@tanstack/react-router'

import { x402PaymentRequiredResponse } from '#/lib/agent-commerce-discovery'

export const Route = createFileRoute('/api/v1/')({
  server: {
    handlers: {
      GET: () => x402PaymentRequiredResponse(undefined, '/api/v1'),
    },
  },
})
