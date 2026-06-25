import { describe, expect, it } from 'vitest'

import {
  buildApiCatalog,
  buildHomepageMarkdown,
  buildOAuthAuthorizationServer,
  buildOAuthProtectedResource,
  sha256Digest,
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
    expect(meta.agent_auth.register_uri).toBe(`${site}/auth.md`)
    expect(meta.grant_types_supported).toContain('authorization_code')
  })

  it('builds protected resource metadata', () => {
    const meta = buildOAuthProtectedResource(site)
    expect(meta.resource).toBe(site)
    expect(meta.authorization_servers).toEqual([`${site}/api/auth`])
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
})
