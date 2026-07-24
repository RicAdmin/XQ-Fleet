import { createFileRoute } from '@tanstack/react-router'

import { agentActionsRouteHandlers } from '#/lib/agent-actions-route'

export const Route = createFileRoute('/api/actions/recommend-car-fit')({
  server: {
    handlers: {
      POST: ({ request }) => agentActionsRouteHandlers.recommendCarFit(request),
    },
  },
})
