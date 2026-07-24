import { createFileRoute } from '@tanstack/react-router'

import { buildGptActionsOpenApi } from '#/lib/agent-commerce-discovery'

export const Route = createFileRoute('/openapi-actions.json')({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(buildGptActionsOpenApi(), null, 2), {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }),
    },
  },
})
