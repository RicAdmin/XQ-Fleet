import { createFileRoute } from '@tanstack/react-router'

import { oauthAuthorizationServerResponse } from '#/lib/agent-discovery'

export const Route = createFileRoute('/well-known/oauth-authorization-server')({
  server: {
    handlers: {
      GET: () => oauthAuthorizationServerResponse(),
    },
  },
})
