import { createFileRoute } from '@tanstack/react-router'

import { agentActionsRouteHandlers } from '#/lib/agent-actions-route'

export const Route = createFileRoute('/api/actions/get-checkout-url')({
  server: {
    handlers: {
      POST: ({ request }) => agentActionsRouteHandlers.getCheckoutUrl(request),
    },
  },
})
