import { createFileRoute } from '@tanstack/react-router'

import { mcpServerCardResponse } from '#/lib/agent-discovery'

export const Route = createFileRoute('/well-known/mcp/server-card.json')({
  server: {
    handlers: {
      GET: () => mcpServerCardResponse(),
    },
  },
})
