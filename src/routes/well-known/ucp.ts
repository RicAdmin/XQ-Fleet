import { createFileRoute } from '@tanstack/react-router'

import { ucpProfileResponse } from '#/lib/agent-commerce-discovery'

export const Route = createFileRoute('/well-known/ucp')({
  server: {
    handlers: {
      GET: () => ucpProfileResponse(),
    },
  },
})
