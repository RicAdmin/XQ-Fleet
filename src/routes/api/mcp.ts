import { createFileRoute } from '@tanstack/react-router'

import { mcpRouteHandler } from '#/lib/mcp-route'

export const Route = createFileRoute('/api/mcp')({
  server: {
    handlers: {
      GET: async ({ request }) => mcpRouteHandler(request),
      POST: async ({ request }) => mcpRouteHandler(request),
      DELETE: async ({ request }) => mcpRouteHandler(request),
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, mcp-session-id, mcp-protocol-version, Last-Event-ID',
            'Access-Control-Expose-Headers': 'mcp-session-id, mcp-protocol-version',
          },
        }),
    },
  },
})
