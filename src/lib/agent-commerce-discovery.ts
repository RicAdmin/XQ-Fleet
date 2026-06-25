import { publicSitePath, publicSiteUrl } from '#/lib/brand'

const UCP_VERSION = '2026-04-08'
const ACP_VERSION = '2026-01-30'
const OPENAPI_VERSION = '3.1.0'

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

export function x402PayToAddress(): string {
  return (
    process.env.X402_PAY_TO?.trim() ||
    '0x0000000000000000000000000000000000000000'
  )
}

export function x402FacilitatorUrl(): string | undefined {
  const url = process.env.X402_FACILITATOR_URL?.trim()
  return url || undefined
}

/** MPP OpenAPI document at /openapi.json with x-payment-info on payable operations. */
export function buildOpenApiCommerce(siteUrl?: string) {
  const base = publicSiteUrl(siteUrl)
  const apiBase = `${base}/api`

  return {
    openapi: OPENAPI_VERSION,
    info: {
      title: 'XQCar Commerce API',
      version: '1.0.0',
      description:
        'Langkawi car rental checkout and booking APIs for agents. Primary settlement via iPay88 (card/FPX, MYR). Optional x402 micropayments for agent API access.',
    },
    servers: [{ url: apiBase }],
    'x-service-info': {
      categories: ['commerce', 'travel', 'car-rental'],
      docs: {
        homepage: `${base}/`,
        llms: publicSitePath('/llms.txt', siteUrl),
        apiReference: publicSitePath('/openapi.json', siteUrl),
      },
    },
    paths: {
      '/acp/checkout_sessions': {
        post: {
          summary: 'Create an agentic checkout session for a car rental booking',
          operationId: 'createCheckoutSession',
          tags: ['acp', 'checkout'],
          'x-payment-info': {
            offers: [
              {
                intent: 'session',
                method: 'card',
                amount: null,
                currency: 'MYR',
                description:
                  'Checkout session total depends on vehicle, dates, and add-ons. Settled via iPay88 card or FPX.',
              },
            ],
          },
          responses: {
            '201': {
              description: 'Checkout session created',
            },
          },
        },
      },
      '/agent/booking-quote': {
        post: {
          summary: 'Quote a rental booking before checkout',
          operationId: 'quoteBooking',
          tags: ['booking'],
          'x-payment-info': {
            offers: [
              {
                intent: 'charge',
                method: 'card',
                amount: null,
                currency: 'MYR',
                description:
                  'Dynamic quote from fleet pricing engine. Economy from RM 70/day.',
              },
            ],
          },
          responses: {
            '200': {
              description: 'Booking quote',
            },
          },
        },
      },
      '/agent/access': {
        get: {
          summary: 'Agent API access (x402-protected catalog probe)',
          operationId: 'agentApiAccess',
          tags: ['agent'],
          'x-payment-info': {
            offers: [
              {
                intent: 'charge',
                method: 'card',
                amount: '0',
                currency: 'MYR',
                description: 'Free discovery probe; x402 settlement optional on /api.',
              },
            ],
          },
          responses: {
            '200': {
              description: 'Access granted',
            },
            '402': {
              description: 'Payment required (x402)',
            },
          },
        },
      },
    },
  }
}

/** UCP profile served at /.well-known/ucp */
export function buildUcpProfile(siteUrl?: string) {
  const base = publicSiteUrl(siteUrl)

  return {
    ucp: {
      version: UCP_VERSION,
      services: {
        'dev.ucp.shopping': [
          {
            version: UCP_VERSION,
            spec: `https://ucp.dev/${UCP_VERSION}/specification/overview`,
            transport: 'rest',
            schema: publicSitePath('/openapi.json', siteUrl),
            endpoint: `${base}/api/acp`,
          },
          {
            version: UCP_VERSION,
            spec: `https://ucp.dev/${UCP_VERSION}/specification/overview`,
            transport: 'mcp',
            endpoint: `${base}/api/mcp`,
            schema: publicSitePath('/.well-known/mcp/server-card.json', siteUrl),
          },
        ],
      },
      capabilities: {
        'dev.ucp.shopping.checkout': [
          {
            version: UCP_VERSION,
            spec: `https://ucp.dev/${UCP_VERSION}/specification/checkout`,
            schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/checkout.json`,
          },
        ],
        'dev.ucp.shopping.fulfillment': [
          {
            version: UCP_VERSION,
            spec: `https://ucp.dev/${UCP_VERSION}/specification/fulfillment`,
            schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/fulfillment.json`,
            extends: 'dev.ucp.shopping.checkout',
          },
        ],
        'dev.ucp.shopping.order': [
          {
            version: UCP_VERSION,
            spec: `https://ucp.dev/${UCP_VERSION}/specification/order`,
            schema: `https://ucp.dev/${UCP_VERSION}/schemas/shopping/order.json`,
          },
        ],
      },
      payment_handlers: {
        'com.ipay88.checkout': [
          {
            id: 'ipay88-card-fpx',
            version: UCP_VERSION,
            spec: 'https://www.ipay88.com/',
            schema: publicSitePath('/openapi.json', siteUrl),
          },
        ],
      },
    },
    signing_keys: [],
  }
}

/** ACP discovery document at /.well-known/acp.json */
export function buildAcpDiscovery(siteUrl?: string) {
  return {
    protocol: {
      name: 'acp',
      version: ACP_VERSION,
      supported_versions: [ACP_VERSION],
      documentation_url: 'https://agenticcommerce.dev',
    },
    api_base_url: publicSitePath('/api/acp', siteUrl),
    transports: ['rest', 'mcp'],
    capabilities: {
      services: ['checkout', 'orders'],
      extensions: [
        {
          name: 'fulfillment',
          spec: `https://ucp.dev/${UCP_VERSION}/specification/fulfillment`,
        },
      ],
      supported_currencies: ['myr'],
      supported_locales: ['en-MY', 'ms-MY', 'zh-MY'],
    },
  }
}

export function buildX402PaymentRequired(siteUrl?: string, resourcePath = '/api') {
  const resourceUrl = publicSitePath(resourcePath, siteUrl)
  const payTo = x402PayToAddress()
  const facilitator = x402FacilitatorUrl()

  const payload: Record<string, unknown> = {
    x402Version: 2,
    error: 'PAYMENT-SIGNATURE header is required',
    resource: {
      url: resourceUrl,
      description: 'XQCar agent commerce API access',
      mimeType: 'application/json',
      serviceName: 'XQCar Langkawi',
    },
    accepts: [
      {
        scheme: 'exact',
        network: 'eip155:8453',
        amount: '1000000',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        payTo,
        maxTimeoutSeconds: 300,
        extra: {
          name: 'USDC',
          version: '2',
        },
      },
    ],
    extensions: {
      primary_checkout: {
        method: 'card',
        currency: 'MYR',
        provider: 'ipay88',
        checkout_url: publicSitePath('/book', siteUrl),
        openapi: publicSitePath('/openapi.json', siteUrl),
      },
    },
  }

  if (facilitator) {
    payload.extensions = {
      ...(payload.extensions as Record<string, unknown>),
      facilitator: { url: facilitator },
    }
  }

  return payload
}

export function encodeX402PaymentRequiredHeader(siteUrl?: string, resourcePath = '/api'): string {
  return Buffer.from(JSON.stringify(buildX402PaymentRequired(siteUrl, resourcePath))).toString(
    'base64',
  )
}

export function x402PaymentRequiredResponse(siteUrl?: string, resourcePath = '/api'): Response {
  const paymentRequired = encodeX402PaymentRequiredHeader(siteUrl, resourcePath)
  return new Response('{}', {
    status: 402,
    statusText: 'Payment Required',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'PAYMENT-REQUIRED': paymentRequired,
    },
  })
}

export function hasX402PaymentSignature(request: Request): boolean {
  return Boolean(request.headers.get('PAYMENT-SIGNATURE')?.trim())
}

export function x402ApiGatewayResponse(request: Request, siteUrl?: string): Response {
  if (hasX402PaymentSignature(request)) {
    return jsonResponse({
      status: 'ok',
      service: 'xqcar-commerce-api',
      message:
        'Payment signature received. Full x402 settlement requires X402_FACILITATOR_URL configuration.',
      discovery: {
        openapi: publicSitePath('/openapi.json', siteUrl),
        ucp: publicSitePath('/.well-known/ucp', siteUrl),
        acp: publicSitePath('/.well-known/acp.json', siteUrl),
        checkout: publicSitePath('/book', siteUrl),
      },
    })
  }

  return x402PaymentRequiredResponse(siteUrl, '/api')
}

export function openApiCommerceResponse(siteUrl?: string): Response {
  return jsonResponse(buildOpenApiCommerce(siteUrl))
}

export function ucpProfileResponse(siteUrl?: string): Response {
  return jsonResponse(buildUcpProfile(siteUrl))
}

export function acpDiscoveryResponse(siteUrl?: string): Response {
  return jsonResponse(buildAcpDiscovery(siteUrl))
}
