import { describe, expect, it } from 'vitest'

import { checkIpRateLimit, clientIpFromRequest } from '#/lib/mcp-rate-limit'

describe('mcp rate limit', () => {
  it('allows requests under the quota', () => {
    const state = new Map<string, number[]>()
    const config = { windowMs: 60_000, maxRequests: 3 }

    expect(checkIpRateLimit('1.2.3.4', 0, state, config).allowed).toBe(true)
    expect(checkIpRateLimit('1.2.3.4', 1_000, state, config).allowed).toBe(true)
    expect(checkIpRateLimit('1.2.3.4', 2_000, state, config).allowed).toBe(true)
  })

  it('denies requests over the quota with a clear failure', () => {
    const state = new Map<string, number[]>()
    const config = { windowMs: 60_000, maxRequests: 2 }

    expect(checkIpRateLimit('9.9.9.9', 0, state, config).allowed).toBe(true)
    expect(checkIpRateLimit('9.9.9.9', 1_000, state, config).allowed).toBe(true)

    const denied = checkIpRateLimit('9.9.9.9', 2_000, state, config)
    expect(denied.allowed).toBe(false)
    if (!denied.allowed) {
      expect(denied.message).toMatch(/rate limit/i)
      expect(denied.retryAfterSeconds).toBeGreaterThan(0)
    }
  })

  it('tracks client ips independently', () => {
    const state = new Map<string, number[]>()
    const config = { windowMs: 60_000, maxRequests: 1 }

    expect(checkIpRateLimit('1.1.1.1', 0, state, config).allowed).toBe(true)
    expect(checkIpRateLimit('2.2.2.2', 0, state, config).allowed).toBe(true)
    expect(checkIpRateLimit('1.1.1.1', 1, state, config).allowed).toBe(false)
  })

  it('prefers Netlify client IP over X-Forwarded-For', () => {
    const request = new Request('http://localhost/api/mcp', {
      headers: {
        'x-nf-client-connection-ip': '203.0.113.10',
        'x-forwarded-for': '198.51.100.99',
      },
    })

    expect(clientIpFromRequest(request)).toBe('203.0.113.10')
  })
})
