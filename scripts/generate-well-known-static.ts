import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  buildAcpDiscovery,
  buildOpenApiCommerce,
  buildUcpProfile,
} from '#/lib/agent-commerce-discovery'
import {
  buildAgentSkillsIndex,
  buildApiCatalog,
  buildAuthMd,
  buildMcpServerCard,
  buildOAuthAuthorizationServer,
  buildOAuthProtectedResource,
  buildOpenIdConfiguration,
} from '#/lib/agent-discovery'

export function resolveBuildSiteUrl(): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.BETTER_AUTH_URL,
    'https://carxq.com',
  ]

  for (const raw of candidates) {
    const trimmed = raw?.trim().replace(/\/$/, '')
    if (trimmed) return trimmed
  }

  return 'https://carxq.com'
}

function writeJson(relativePath: string, payload: unknown, siteUrl: string) {
  const outFile = join(process.cwd(), 'public', relativePath)
  mkdirSync(join(outFile, '..'), { recursive: true })
  writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  console.log(`[well-known] Wrote ${relativePath} for ${siteUrl}`)
}

function writeText(relativePath: string, content: string, siteUrl: string) {
  const outFile = join(process.cwd(), 'public', relativePath)
  mkdirSync(join(outFile, '..'), { recursive: true })
  writeFileSync(outFile, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
  console.log(`[well-known] Wrote ${relativePath} for ${siteUrl}`)
}

const siteUrl = resolveBuildSiteUrl()

writeJson('.well-known/api-catalog', buildApiCatalog(siteUrl), siteUrl)
writeJson(
  '.well-known/oauth-authorization-server',
  buildOAuthAuthorizationServer(siteUrl),
  siteUrl,
)
writeJson('.well-known/openid-configuration', buildOpenIdConfiguration(siteUrl), siteUrl)
writeJson(
  '.well-known/oauth-protected-resource',
  buildOAuthProtectedResource(siteUrl),
  siteUrl,
)
writeJson('.well-known/mcp/server-card.json', buildMcpServerCard(siteUrl), siteUrl)
writeJson('.well-known/agent-skills/index.json', buildAgentSkillsIndex(siteUrl), siteUrl)
writeJson('.well-known/acp.json', buildAcpDiscovery(siteUrl), siteUrl)
writeJson('.well-known/ucp', buildUcpProfile(siteUrl), siteUrl)
writeJson('openapi.json', buildOpenApiCommerce(siteUrl), siteUrl)
writeText('auth.md', buildAuthMd(siteUrl), siteUrl)
