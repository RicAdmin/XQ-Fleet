import { createFileRoute } from '@tanstack/react-router'

import { oauthProtectedResourceResponse } from '#/lib/agent-discovery'

export const Route = createFileRoute('/well-known/oauth-protected-resource')({
  server: {
    handlers: {
      GET: () => oauthProtectedResourceResponse(),
    },
  },
})
