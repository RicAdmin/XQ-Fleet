import { createFileRoute } from '@tanstack/react-router'

import { agentActionsRouteHandlers } from '#/lib/agent-actions-route'

export const Route = createFileRoute('/api/actions/search-available-cars')({
  server: {
    handlers: {
      POST: ({ request }) =>
        agentActionsRouteHandlers.searchAvailableCars(request),
    },
  },
})
