import '@tanstack/react-start/server-only'

import {
  apiCatalogResponse,
  mcpServerCardResponse,
  oauthAuthorizationServerResponse,
  oauthProtectedResourceResponse,
  openIdConfigurationResponse,
} from '#/lib/agent-discovery'
import { buildAgentSkillsIndex } from '#/lib/agent-discovery-skills'

export { buildAgentSkillsIndex, sha256Digest } from '#/lib/agent-discovery-skills'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export function agentSkillsIndexResponse(siteUrl?: string): Response {
  return jsonResponse(buildAgentSkillsIndex(siteUrl))
}

/** Resolve a discovery document response for dotted or undotted well-known paths. */
export function wellKnownDiscoveryResponse(
  pathname: string,
  siteUrl?: string,
): Response | null {
  const path = pathname.replace(/^\/\.well-known(?=\/|$)/, '/well-known')
  switch (path) {
    case '/well-known/api-catalog':
      return apiCatalogResponse(siteUrl)
    case '/well-known/openid-configuration':
      return openIdConfigurationResponse(siteUrl)
    case '/well-known/oauth-authorization-server':
      return oauthAuthorizationServerResponse(siteUrl)
    case '/well-known/oauth-protected-resource':
      return oauthProtectedResourceResponse(siteUrl)
    case '/well-known/mcp/server-card.json':
      return mcpServerCardResponse(siteUrl)
    case '/well-known/agent-skills/index.json':
      return agentSkillsIndexResponse(siteUrl)
    default:
      return null
  }
}
