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
      '/actions/search-available-cars': {
        post: {
          summary: 'Search Available cars for a Trip',
          description:
            'Returns fleet cars available for the requested pickup and return dates with non-binding Quote estimates. Does not create a Rental.',
          operationId: 'searchAvailableCars',
          tags: ['gpt-actions', 'fleet'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    startDate: {
                      type: 'string',
                      format: 'date',
                      description: 'Trip pickup date in YYYY-MM-DD format.',
                    },
                    endDate: {
                      type: 'string',
                      format: 'date',
                      description: 'Trip return date in YYYY-MM-DD format.',
                    },
                  },
                  required: ['startDate', 'endDate'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Available cars and non-binding Quote estimates.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      cars: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            displayName: { type: 'string' },
                            category: {
                              type: 'string',
                              enum: ['economy', 'mpv', 'suv', 'other'],
                            },
                            dailyRateMyr: { type: 'number' },
                            quoteEstimate: {
                              type: 'object',
                              properties: {
                                nights: { type: 'integer' },
                                estimatedTotalMyr: { type: 'number' },
                                disclaimer: { type: 'string' },
                              },
                              required: [
                                'nights',
                                'estimatedTotalMyr',
                                'disclaimer',
                              ],
                            },
                          },
                          required: [
                            'id',
                            'displayName',
                            'category',
                            'dailyRateMyr',
                            'quoteEstimate',
                          ],
                        },
                      },
                    },
                    required: ['message', 'cars'],
                  },
                },
              },
            },
            '400': {
              description: 'Invalid Trip dates or JSON request body.',
            },
          },
        },
      },
      '/actions/get-checkout-url': {
        post: {
          summary: 'Create a Checkout URL for a selected car and Trip',
          description:
            'Returns an English Checkout URL with Trip details prefilled. Opening the URL does not create a Rental or payment.',
          operationId: 'getCheckoutUrl',
          tags: ['gpt-actions', 'checkout'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    carId: {
                      type: 'string',
                      description:
                        'Stable car id returned by searchAvailableCars.',
                    },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    from: {
                      type: 'string',
                      description:
                        'Pickup meet point, such as lgk-airport or kuah-jetty.',
                    },
                    retLoc: {
                      type: 'string',
                      description:
                        'Return meet point, such as lgk-airport or kuah-jetty.',
                    },
                    tripType: {
                      type: 'string',
                      enum: ['round', 'oneway'],
                    },
                    pickTime: {
                      type: 'string',
                      pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
                      example: '10:00',
                    },
                    retTime: {
                      type: 'string',
                      pattern: '^([01]\\d|2[0-3]):[0-5]\\d$',
                      example: '10:00',
                    },
                    adults: { type: 'integer', minimum: 1, maximum: 9 },
                    children: { type: 'integer', minimum: 0, maximum: 8 },
                  },
                  required: ['carId', 'startDate', 'endDate'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Checkout URL for the selected car and Trip.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      checkoutUrl: { type: 'string', format: 'uri' },
                    },
                    required: ['checkoutUrl'],
                  },
                },
              },
            },
            '400': {
              description:
                'Invalid Trip, unknown car id, or JSON request body.',
            },
          },
        },
      },
      '/actions/recommend-car-fit': {
        post: {
          summary: 'Recommend a Car fit from Hire intent',
          description:
            'Returns a primary Category, alternatives, and example fleet cars. This is not Trip availability and does not create a Rental.',
          operationId: 'recommendCarFit',
          tags: ['gpt-actions', 'fleet'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    adults: { type: 'integer', minimum: 1, maximum: 9 },
                    children: {
                      type: 'integer',
                      minimum: 0,
                      maximum: 8,
                      default: 0,
                    },
                    bags: { type: 'integer', minimum: 0, default: 0 },
                    tripStyle: {
                      type: 'string',
                      enum: ['Small', 'Comfort', 'Adventure'],
                    },
                  },
                  required: ['adults'],
                },
              },
            },
          },
          responses: {
            '200': {
              description:
                'Car fit recommendation with Category and fleet examples.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      primary: { type: 'object', additionalProperties: true },
                      alternatives: {
                        type: 'array',
                        items: { type: 'object', additionalProperties: true },
                      },
                      tightFit: { type: 'boolean' },
                      partialFit: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                    required: [
                      'primary',
                      'alternatives',
                      'tightFit',
                      'partialFit',
                      'message',
                    ],
                  },
                },
              },
            },
            '400': {
              description: 'Invalid Hire intent or JSON request body.',
            },
          },
        },
      },
      '/acp/checkout_sessions': {
        post: {
          summary:
            'Create an agentic checkout session for a car rental booking',
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
                description:
                  'Free discovery probe; x402 settlement optional on /api.',
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

/** Focused OpenAPI document for direct import into the Custom GPT Actions editor. */
export function buildGptActionsOpenApi(siteUrl?: string) {
  const commerce = buildOpenApiCommerce(siteUrl)
  return {
    openapi: commerce.openapi,
    info: {
      title: 'XQ Car Langkawi GPT Actions',
      version: commerce.info.version,
      description:
        'Search Available cars, recommend a Car fit, and hand customers off to XQ Car Checkout. These Actions do not create a Rental or settle payment.',
    },
    servers: commerce.servers,
    paths: {
      '/actions/search-available-cars':
        commerce.paths['/actions/search-available-cars'],
      '/actions/get-checkout-url': commerce.paths['/actions/get-checkout-url'],
      '/actions/recommend-car-fit':
        commerce.paths['/actions/recommend-car-fit'],
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
            schema: publicSitePath(
              '/.well-known/mcp/server-card.json',
              siteUrl,
            ),
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

export function buildX402PaymentRequired(
  siteUrl?: string,
  resourcePath = '/api',
) {
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

export function encodeX402PaymentRequiredHeader(
  siteUrl?: string,
  resourcePath = '/api',
): string {
  return Buffer.from(
    JSON.stringify(buildX402PaymentRequired(siteUrl, resourcePath)),
  ).toString('base64')
}

export function x402PaymentRequiredResponse(
  siteUrl?: string,
  resourcePath = '/api',
): Response {
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

export function x402ApiGatewayResponse(
  request: Request,
  siteUrl?: string,
): Response {
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
