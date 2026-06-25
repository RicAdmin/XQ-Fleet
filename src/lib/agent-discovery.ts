import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { publicSitePath, publicSiteUrl } from '#/lib/brand'

const API_CATALOG_PROFILE = 'https://www.rfc-editor.org/info/rfc9727'
const AGENT_SKILLS_SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json'
const AUTH_MD_SKILL = 'https://workos.com/auth-md/v1'

export function authIssuer(siteUrl?: string): string {
  return publicSitePath('/api/auth', siteUrl)
}

export function agentDiscoveryLinkHeader(siteUrl?: string): string {
  const origin = publicSiteUrl(siteUrl)
  return [
    `</.well-known/api-catalog>; rel="api-catalog"`,
    `</.well-known/openid-configuration>; rel="openid-configuration"`,
    `</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"`,
    `</.well-known/mcp/server-card.json>; rel="describedby"`,
    `</.well-known/acp.json>; rel="describedby"`,
    `</.well-known/ucp>; rel="describedby"`,
    `</openapi.json>; rel="service-desc"`,
    `</llms.txt>; rel="describedby"`,
    `</auth.md>; rel="service-doc"`,
    `<${origin}/.well-known/agent-skills/index.json>; rel="describedby"`,
  ].join(', ')
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ...(init?.headers ?? {}),
    },
  })
}

export function buildApiCatalog(siteUrl?: string) {
  const base = publicSiteUrl(siteUrl)
  const authBase = authIssuer(siteUrl)

  return {
    linkset: [
      {
        anchor: authBase,
        'service-desc': [
          {
            href: publicSitePath('/openapi/auth.json', siteUrl),
            type: 'application/openapi+json',
          },
        ],
        'service-doc': [
          {
            href: publicSitePath('/auth.md', siteUrl),
            type: 'text/markdown',
          },
        ],
        status: [
          {
            href: publicSitePath('/api/health', siteUrl),
            type: 'application/json',
          },
        ],
      },
      {
        anchor: publicSitePath('/api/webhooks/ipay88', siteUrl),
        'service-doc': [
          {
            href: publicSitePath('/llms.txt', siteUrl),
            type: 'text/plain',
          },
        ],
      },
      {
        anchor: `${base}/`,
        'service-desc': [
          {
            href: publicSitePath('/openapi/auth.json', siteUrl),
            type: 'application/openapi+json',
          },
          {
            href: publicSitePath('/.well-known/mcp/server-card.json', siteUrl),
            type: 'application/json',
          },
        ],
        'service-doc': [
          {
            href: publicSitePath('/llms.txt', siteUrl),
            type: 'text/plain',
          },
          {
            href: publicSitePath('/auth.md', siteUrl),
            type: 'text/markdown',
          },
        ],
        status: [
          {
            href: publicSitePath('/api/health', siteUrl),
            type: 'application/json',
          },
        ],
      },
    ],
  }
}

export function apiCatalogResponse(siteUrl?: string): Response {
  return new Response(JSON.stringify(buildApiCatalog(siteUrl), null, 2), {
    headers: {
      'Content-Type': `application/linkset+json; profile="${API_CATALOG_PROFILE}"`,
      'Cache-Control': 'public, max-age=3600',
      Link: agentDiscoveryLinkHeader(siteUrl),
    },
  })
}

export function buildOAuthAuthorizationServer(siteUrl?: string) {
  const issuer = authIssuer(siteUrl)
  return {
    issuer,
    authorization_endpoint: `${issuer}/sign-in/social/google`,
    token_endpoint: `${issuer}/token`,
    jwks_uri: `${issuer}/jwks`,
    registration_endpoint: publicSitePath('/auth.md', siteUrl),
    grant_types_supported: ['authorization_code', 'refresh_token'],
    response_types_supported: ['code'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    agent_auth: {
      skill: AUTH_MD_SKILL,
      register_uri: publicSitePath('/auth.md', siteUrl),
      identity_types_supported: ['anonymous', 'verified_email'],
      revocation_uri: `${issuer}/sign-out`,
      anonymous: {
        credential_types_supported: ['session_cookie'],
        claim_uri: publicSitePath('/privacy', siteUrl),
      },
      verified_email: {
        assertion_types_supported: ['verified_email'],
        credential_types_supported: ['session_cookie', 'bearer'],
        claim_uri: publicSitePath('/privacy', siteUrl),
      },
    },
  }
}

export function buildAuthMd(siteUrl?: string): string {
  const base = publicSiteUrl(siteUrl)
  const resource = `${base}/`
  const issuer = authIssuer(siteUrl)

  return `# auth.md

Agent authentication and registration for **XQCar** (Langkawi car rental).

## Audience

This document is for AI agents and automated clients that need to discover how to authenticate with XQCar customer and staff APIs.

## Resource server

- **Resource identifier:** \`${resource}\`
- **Protected resource metadata:** [/.well-known/oauth-protected-resource](${base}/.well-known/oauth-protected-resource)

## Authorization server

- **Issuer:** \`${issuer}\`
- **OAuth metadata:** [/.well-known/oauth-authorization-server](${base}/.well-known/oauth-authorization-server)
- **OpenID Connect:** [/.well-known/openid-configuration](${base}/.well-known/openid-configuration)
- **Registration:** \`${base}/auth.md\` (this document)

## Registration

XQCar uses session-based authentication for the public booking site. Agents should:

1. Read [llms.txt](${base}/llms.txt) for site structure and booking flows.
2. Use [/.well-known/api-catalog](${base}/.well-known/api-catalog) for machine-readable API discovery.
3. For customer accounts, direct users to [login](${base}/login) or [register](${base}/register) — agents must not create accounts without explicit user consent.
4. For programmatic access requests, contact **hello@carxq.my** with use case, expected volume, and OAuth client details.

## Supported identity types

| Type | Method | Notes |
|------|--------|-------|
| Anonymous | Session cookie | Browse fleet and public content only |
| Verified email | Email/password or Google OAuth | Required for bookings and account management |

## Scopes

- \`openid\` — OpenID Connect identity
- \`profile\` — Name and profile fields
- \`email\` — Email address
- \`offline_access\` — Refresh token (when OAuth client access is provisioned)

## Bearer methods

- \`Authorization: Bearer <token>\` (when API tokens are provisioned)
- Session cookies for browser-based flows via \`/api/auth\`

## Revocation

Session revocation: \`POST ${issuer}/sign-out\`

For API token revocation, contact hello@carxq.my.

## Related discovery

- [MCP server card](${base}/.well-known/mcp/server-card.json)
- [Agent skills index](${base}/.well-known/agent-skills/index.json)
- [Privacy policy](${base}/privacy)
`
}

export function buildOpenIdConfiguration(siteUrl?: string) {
  const oauth = buildOAuthAuthorizationServer(siteUrl)
  const issuer = authIssuer(siteUrl)
  return {
    ...oauth,
    issuer,
    userinfo_endpoint: `${issuer}/userinfo`,
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'EdDSA'],
    response_modes_supported: ['query', 'fragment'],
  }
}

export function buildOAuthProtectedResource(siteUrl?: string) {
  const resource = `${publicSiteUrl(siteUrl)}/`
  const issuer = authIssuer(siteUrl)
  return {
    resource,
    authorization_servers: [issuer],
    jwks_uri: `${issuer}/jwks`,
    scopes_supported: ['openid', 'profile', 'email'],
    bearer_methods_supported: ['header'],
    resource_documentation: publicSitePath('/auth.md', siteUrl),
  }
}

export function buildMcpServerCard(siteUrl?: string) {
  const base = publicSiteUrl(siteUrl)
  return {
    $schema: 'https://modelcontextprotocol.io/schemas/server-card/v1',
    serverInfo: {
      name: 'XQCar Langkawi',
      version: '1.0.0',
    },
    transport: {
      type: 'streamable-http',
      endpoint: `${base}/api/mcp`,
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
    },
    documentation: publicSitePath('/llms.txt', siteUrl),
    authentication: {
      type: 'oauth2',
      protectedResourceMetadata: publicSitePath('/.well-known/oauth-protected-resource', siteUrl),
    },
  }
}

type AgentSkillEntry = {
  name: string
  type: 'skill-md'
  description: string
  url: string
  digest: string
}

export function sha256Digest(content: string): string {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

export function buildAgentSkillsIndex(siteUrl?: string): {
  $schema: string
  skills: AgentSkillEntry[]
} {
  const skillsDir = join(process.cwd(), 'public/.well-known/agent-skills')
  const skillFiles = [
    {
      name: 'book-langkawi-car',
      file: 'book-langkawi-car.md',
      description: 'Book a car rental in Langkawi via XQCar — dates, fleet, pickup, and checkout.',
    },
    {
      name: 'langkawi-driving-guides',
      file: 'langkawi-driving-guides.md',
      description: 'Langkawi driving guides — pickup, routes, parking, fuel, and island know-how.',
    },
  ]

  const skills: AgentSkillEntry[] = skillFiles.map(({ name, file, description }) => {
    const filePath = join(skillsDir, file)
    const content = readFileSync(filePath, 'utf8')
    return {
      name,
      type: 'skill-md',
      description,
      url: publicSitePath(`/.well-known/agent-skills/${file}`, siteUrl),
      digest: sha256Digest(content),
    }
  })

  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills,
  }
}

export function buildHomepageMarkdown(siteUrl?: string): string {
  const base = publicSiteUrl(siteUrl)
  return `# XQCar — Langkawi Car Rental

> Family-owned car rental in Langkawi, Malaysia since 2015. Book online from RM 70/day with free delivery to Langkawi International Airport (LGK) Door 3, Kuah Ferry Jetty, or your hotel.

## Quick links

- [Home](${base}/): Search dates, browse fleet, book in ~90 seconds
- [About XQ Car](${base}/about): Licensed operator, owned fleet, island-wide delivery
- [Pick the right car](${base}/guides/pick-car): Fleet categories for Langkawi trips
- [Pickup & return](${base}/guides/pickup-return): Airport, jetty, and hotel meet points
- [Plan my drive](${base}/guides/plan-drive): Island route planner
- [Know-how](${base}/guides/know-how): Parking, fuel, fines, accidents
- [Blog & guides](${base}/blog): 20+ Langkawi car rental articles

## Contact

- Phone: +60 11 3521 5576 (24/7 roadside support)
- Email: hello@carxq.my
- Office: 26 & 28, 1st Floor, Jalan Pandak Mayah 4, Mukim Kuah, 07000 Langkawi, Kedah, Malaysia

## Agent discovery

- [API catalog](${base}/.well-known/api-catalog)
- [OpenAPI commerce (MPP)](${base}/openapi.json)
- [UCP profile](${base}/.well-known/ucp)
- [ACP discovery](${base}/.well-known/acp.json)
- [LLMs index](${base}/llms.txt)
- [Auth.md](${base}/auth.md)
- [Agent skills](${base}/.well-known/agent-skills/index.json)
- [MCP server card](${base}/.well-known/mcp/server-card.json)

## Policies

- [Terms](${base}/terms) · [Privacy](${base}/privacy) · [PDPA](${base}/pdpa) · [Refund policy](${base}/refund-policy)

© 2026 XQCar · Xiao Qiang Holidays Sdn Bhd 201301017811 - Release.260626.01
`
}

export function estimateMarkdownTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4)
}

export function markdownNegotiationResponse(
  markdown: string,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'x-markdown-tokens': String(estimateMarkdownTokens(markdown)),
      ...extraHeaders,
    },
  })
}

export function acceptsMarkdown(request: Request): boolean {
  const accept = request.headers.get('Accept') ?? ''
  return accept.includes('text/markdown')
}

export function withAgentDiscoveryLinkHeader(
  response: Response,
  siteUrl?: string,
): Response {
  const headers = new Headers(response.headers)
  headers.set('Link', agentDiscoveryLinkHeader(siteUrl))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/** Attach RFC 8288 Link headers after deferring to TanStack SSR (`next()`). */
export async function deferWithAgentDiscoveryLinkHeader(
  next: () => Promise<unknown>,
  siteUrl?: string,
): Promise<unknown> {
  const ctx = await next()
  if (!ctx || typeof ctx !== 'object' || !('response' in ctx)) {
    return ctx
  }

  const response = (ctx as { response?: unknown }).response
  if (!(response instanceof Response)) {
    return ctx
  }

  return {
    ...ctx,
    response: withAgentDiscoveryLinkHeader(response, siteUrl),
  }
}

export function oauthAuthorizationServerResponse(siteUrl?: string): Response {
  return jsonResponse(buildOAuthAuthorizationServer(siteUrl))
}

export function openIdConfigurationResponse(siteUrl?: string): Response {
  return jsonResponse(buildOpenIdConfiguration(siteUrl))
}

export function oauthProtectedResourceResponse(siteUrl?: string): Response {
  return jsonResponse(buildOAuthProtectedResource(siteUrl))
}

export function mcpServerCardResponse(siteUrl?: string): Response {
  return jsonResponse(buildMcpServerCard(siteUrl))
}

export function agentSkillsIndexResponse(siteUrl?: string): Response {
  return jsonResponse(buildAgentSkillsIndex(siteUrl))
}
