import { describe, expect, it } from 'vitest'

import {
  buildAcpDiscovery,
  buildOpenApiCommerce,
  buildUcpProfile,
  buildX402PaymentRequired,
  encodeX402PaymentRequiredHeader,
  hasX402PaymentSignature,
  x402ApiGatewayResponse,
  x402PaymentRequiredResponse,
} from '#/lib/agent-commerce-discovery'

describe('agent-commerce-discovery', () => {
  const site = 'https://carxq.com'

  it('builds MPP openapi.json with x-payment-info on payable operations', () => {
    const doc = buildOpenApiCommerce(site)
    expect(doc.openapi).toBe('3.1.0')
    expect(doc['x-service-info']?.categories).toContain('commerce')

    const checkout = doc.paths['/acp/checkout_sessions']?.post
    expect(checkout?.['x-payment-info']?.offers?.[0]).toMatchObject({
      intent: 'session',
      method: 'card',
      currency: 'MYR',
    })

    const quote = doc.paths['/agent/booking-quote']?.post
    expect(quote?.['x-payment-info']?.offers?.[0]?.intent).toBe('charge')
  })

  it('builds UCP profile with services, capabilities, and payment handlers', () => {
    const profile = buildUcpProfile(site)
    expect(profile.ucp.version).toBeTruthy()
    expect(profile.ucp.services['dev.ucp.shopping']?.length).toBeGreaterThan(0)
    expect(profile.ucp.capabilities['dev.ucp.shopping.checkout']).toBeTruthy()
    expect(profile.ucp.payment_handlers['com.ipay88.checkout']).toBeTruthy()
    expect(profile.signing_keys).toEqual([])
  })

  it('builds ACP discovery with protocol name acp', () => {
    const acp = buildAcpDiscovery(site)
    expect(acp.protocol.name).toBe('acp')
    expect(acp.protocol.version).toBeTruthy()
    expect(acp.api_base_url).toBe(`${site}/api/acp`)
    expect(acp.capabilities.services).toContain('checkout')
  })

  it('returns HTTP 402 with PAYMENT-REQUIRED header for x402', () => {
    const response = x402PaymentRequiredResponse(site)
    expect(response.status).toBe(402)
    const header = response.headers.get('PAYMENT-REQUIRED')
    expect(header).toBeTruthy()

    const decoded = JSON.parse(Buffer.from(header!, 'base64').toString('utf8'))
    expect(decoded.x402Version).toBe(2)
    expect(decoded.resource.url).toBe(`${site}/api`)
    expect(decoded.accepts[0].scheme).toBe('exact')
  })

  it('builds x402 payment required payload with primary card checkout extension', () => {
    const payload = buildX402PaymentRequired(site)
    expect(payload.extensions).toMatchObject({
      primary_checkout: {
        method: 'card',
        currency: 'MYR',
        provider: 'ipay88',
      },
    })
  })

  it('encodes PAYMENT-REQUIRED header consistently', () => {
    const encoded = encodeX402PaymentRequiredHeader(site)
    expect(typeof encoded).toBe('string')
    expect(encoded.length).toBeGreaterThan(20)
  })

  it('detects PAYMENT-SIGNATURE header', () => {
    const withSig = new Request('https://example.com/api', {
      headers: { 'PAYMENT-SIGNATURE': 'abc' },
    })
    const withoutSig = new Request('https://example.com/api')
    expect(hasX402PaymentSignature(withSig)).toBe(true)
    expect(hasX402PaymentSignature(withoutSig)).toBe(false)
  })

  it('returns 200 when PAYMENT-SIGNATURE is present on api gateway', async () => {
    const request = new Request(`${site}/api`, {
      headers: { 'PAYMENT-SIGNATURE': 'dGVzdA==' },
    })
    const response = x402ApiGatewayResponse(request, site)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.discovery.openapi).toBe(`${site}/openapi.json`)
  })
})
