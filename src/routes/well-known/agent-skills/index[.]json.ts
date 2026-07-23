import { createFileRoute } from '@tanstack/react-router'

import { agentSkillsIndexResponse } from '#/lib/agent-discovery.server'

export const Route = createFileRoute('/well-known/agent-skills/index.json')({
  server: {
    handlers: {
      GET: () => agentSkillsIndexResponse(),
    },
  },
})
