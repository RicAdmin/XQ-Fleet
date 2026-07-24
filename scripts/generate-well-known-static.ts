import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  buildAcpDiscovery,
  buildGptActionsOpenApi,
  buildOpenApiCommerce,
  buildUcpProfile,
} from '#/lib/agent-commerce-discovery'
import {
  buildApiCatalog,
  buildAuthMd,
  buildMcpServerCard,
  buildOAuthAuthorizationServer,
  buildOAuthProtectedResource,
  buildOpenIdConfiguration,
} from '#/lib/agent-discovery'
import { buildAgentSkillsIndex } from '#/lib/agent-discovery-skills'

export function resolveBuildSiteUrl(): string {
  const candidates = [
    process.env.SITE_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.BETTER_AUTH_URL,
    'https://car.xqholidays.com.my',
  ]

  for (const raw of candidates) {
    const trimmed = raw?.trim().replace(/\/$/, '')
    if (trimmed) return trimmed
  }

  return 'https://car.xqholidays.com.my'
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
  writeFileSync(
    outFile,
    content.endsWith('\n') ? content : `${content}\n`,
    'utf8',
  )
  console.log(`[well-known] Wrote ${relativePath} for ${siteUrl}`)
}

const siteUrl = resolveBuildSiteUrl()

const discoveryFiles: Array<{ path: string; payload: unknown }> = [
  { path: 'api-catalog', payload: buildApiCatalog(siteUrl) },
  {
    path: 'oauth-authorization-server',
    payload: buildOAuthAuthorizationServer(siteUrl),
  },
  { path: 'openid-configuration', payload: buildOpenIdConfiguration(siteUrl) },
  {
    path: 'oauth-protected-resource',
    payload: buildOAuthProtectedResource(siteUrl),
  },
  { path: 'mcp/server-card.json', payload: buildMcpServerCard(siteUrl) },
  { path: 'agent-skills/index.json', payload: buildAgentSkillsIndex(siteUrl) },
  { path: 'acp.json', payload: buildAcpDiscovery(siteUrl) },
  { path: 'ucp', payload: buildUcpProfile(siteUrl) },
]

for (const file of discoveryFiles) {
  // Dotted path for local/dev; Netlify often strips `.well-known` from publishes.
  writeJson(`.well-known/${file.path}`, file.payload, siteUrl)
  // Undotted fallback for Netlify static + redirect/edge rewrite targets.
  writeJson(`well-known/${file.path}`, file.payload, siteUrl)
}

writeJson('openapi.json', buildOpenApiCommerce(siteUrl), siteUrl)
writeJson('openapi-actions.json', buildGptActionsOpenApi(siteUrl), siteUrl)
writeText('auth.md', buildAuthMd(siteUrl), siteUrl)

// Skill markdown lives under public/.well-known/agent-skills/; mirror for Netlify undotted publish.
const skillMarkdown = ['book-langkawi-car.md', 'langkawi-driving-guides.md']
for (const file of skillMarkdown) {
  const from = join(process.cwd(), 'public/.well-known/agent-skills', file)
  const toDir = join(process.cwd(), 'public/well-known/agent-skills')
  mkdirSync(toDir, { recursive: true })
  copyFileSync(from, join(toDir, file))
  console.log(`[well-known] Mirrored agent-skills/${file}`)
}

// Prefer publish-dir redirects (processed before some framework catch-alls).
writeText(
  '_redirects',
  [
    '# Map RFC 8615 discovery paths onto undotted publish/SSR routes',
    '/.well-known/*  /well-known/:splat  200!',
    '',
  ].join('\n'),
  siteUrl,
)
