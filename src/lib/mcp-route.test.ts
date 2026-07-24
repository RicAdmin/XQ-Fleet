import { describe, expect, it } from 'vitest'

import { createMcpRouteHandler } from '#/lib/mcp-route'

describe('MCP route handler', () => {
  it('fails closed with a clear rate-limit error when the IP is over quota', async () => {
    const state = new Map<string, number[]>()
    state.set('203.0.113.10', [Date.now() - 2_000, Date.now() - 1_000])

    const handler = createMcpRouteHandler({
      rateLimitState: state,
      rateLimit: { windowMs: 60_000, maxRequests: 2 },
    })

    const request = new Request('http://localhost/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '203.0.113.10',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
    })

    const response = await handler(request)
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()

    const body = (await response.json()) as { error: string; message: string }
    expect(body.error).toBe('rate_limit_exceeded')
    expect(body.message).toMatch(/rate limit/i)
  })
})
