import { createFileRoute } from '@tanstack/react-router'

import { acpDiscoveryResponse } from '#/lib/agent-commerce-discovery'

export const Route = createFileRoute('/well-known/acp.json')({
  server: {
    handlers: {
      GET: () => acpDiscoveryResponse(),
    },
  },
})
