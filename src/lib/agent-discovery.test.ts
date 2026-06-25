import { describe, expect, it } from 'vitest'

import {
  buildApiCatalog,
  buildAuthMd,
  buildHomepageMarkdown,
  buildMcpServerCard,
  buildAgentSkillsIndex,
  buildOAuthAuthorizationServer,
  buildOAuthProtectedResource,
  buildOpenIdConfiguration,
  sha256Digest,
  withAgentDiscoveryLinkHeader,
} from '#/lib/agent-discovery'

describe('agent-discovery', () => {
  const site = 'https://carxq.com'

  it('builds RFC 9727 api catalog linkset', () => {
    const catalog = buildApiCatalog(site)
    expect(catalog.linkset.length).toBeGreaterThan(0)
    expect(catalog.linkset[0]).toMatchObject({
      anchor: `${site}/api/auth`,
    })
    expect(catalog.linkset[0]['service-desc']?.[0]?.href).toBe(`${site}/openapi/auth.json`)
  })

  it('builds oauth authorization server metadata with agent_auth', () => {
    const meta = buildOAuthAuthorizationServer(site)
    expect(meta.issuer).toBe(`${site}/api/auth`)
    expect(meta.authorization_endpoint).toBe(`${site}/api/auth/sign-in/social/google`)
    expect(meta.token_endpoint).toBe(`${site}/api/auth/token`)
    expect(meta.jwks_uri).toBe(`${site}/api/auth/jwks`)
    expect(meta.agent_auth.register_uri).toBe(`${site}/auth.md`)
    expect(meta.agent_auth.revocation_uri).toBe(`${site}/api/auth/sign-out`)
    expect(meta.grant_types_supported).toContain('authorization_code')
  })

  it('builds auth.md with required heading and discovery links', () => {
    const md = buildAuthMd(site)
    expect(md).toMatch(/^# auth\.md/m)
    expect(md).toContain(`${site}/.well-known/oauth-protected-resource`)
    expect(md).toContain(`${site}/.well-known/oauth-authorization-server`)
    expect(md).toContain('Resource identifier')
  })

  it('builds MCP server card for SEP-1649 discovery', () => {
    const card = buildMcpServerCard(site)
    expect(card.serverInfo).toEqual({ name: 'XQCar Langkawi', version: '1.0.0' })
    expect(card.transport).toMatchObject({
      type: 'streamable-http',
      endpoint: `${site}/api/mcp`,
    })
    expect(card.capabilities).toMatchObject({
      tools: true,
      resources: true,
      prompts: false,
    })
  })

  it('builds agent skills discovery index v0.2.0', () => {
    const index = buildAgentSkillsIndex(site)
    expect(index.$schema).toBe('https://schemas.agentskills.io/discovery/0.2.0/schema.json')
    expect(index.skills.length).toBeGreaterThanOrEqual(2)
    for (const skill of index.skills) {
      expect(skill.name).toMatch(/^[a-z0-9-]+$/)
      expect(skill.type).toBe('skill-md')
      expect(skill.description.length).toBeGreaterThan(0)
      expect(skill.url).toMatch(new RegExp(`^${site}/\\.well-known/agent-skills/`))
      expect(skill.digest).toMatch(/^sha256:[a-f0-9]{64}$/)
    }
  })

  it('builds openid configuration with required discovery fields', () => {
    const meta = buildOpenIdConfiguration(site)
    expect(meta.issuer).toBe(`${site}/api/auth`)
    expect(meta.authorization_endpoint).toBeTruthy()
    expect(meta.token_endpoint).toBeTruthy()
    expect(meta.jwks_uri).toBeTruthy()
    expect(meta.grant_types_supported).toContain('authorization_code')
    expect(meta.response_types_supported).toContain('code')
    expect(meta.userinfo_endpoint).toBe(`${site}/api/auth/userinfo`)
  })

  it('builds protected resource metadata', () => {
    const meta = buildOAuthProtectedResource(site)
    expect(meta.resource).toBe(`${site}/`)
    expect(meta.authorization_servers).toEqual([`${site}/api/auth`])
    expect(meta.scopes_supported).toContain('openid')
    expect(meta.bearer_methods_supported).toContain('header')
    expect(meta.resource_documentation).toBe(`${site}/auth.md`)
  })

  it('returns homepage markdown with discovery links', () => {
    const md = buildHomepageMarkdown(site)
    expect(md).toContain('# XQCar')
    expect(md).toContain(`${site}/.well-known/api-catalog`)
    expect(md).toContain(`${site}/llms.txt`)
  })

  it('computes sha256 digest prefix', () => {
    expect(sha256Digest('test')).toMatch(/^sha256:[a-f0-9]{64}$/)
  })

  it('adds Link header to HTML responses', () => {
    const response = withAgentDiscoveryLinkHeader(
      new Response('<html></html>', { headers: { 'Content-Type': 'text/html' } }),
      site,
    )
    expect(response.headers.get('Link')).toContain('rel="api-catalog"')
    expect(response.headers.get('Link')).toContain('</.well-known/api-catalog>')
  })
})
