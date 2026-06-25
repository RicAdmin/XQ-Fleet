import { createFileRoute } from '@tanstack/react-router'

import { openIdConfigurationResponse } from '#/lib/agent-discovery'

export const Route = createFileRoute('/well-known/openid-configuration')({
  server: {
    handlers: {
      GET: () => openIdConfigurationResponse(),
    },
  },
})
