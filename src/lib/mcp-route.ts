import { publicSiteUrl } from '#/lib/brand'
import { handleMcpHttpRequest } from '#/lib/mcp-server'
import {
  checkIpRateLimit,
  clientIpFromRequest,
  type RateLimitConfig,
} from '#/lib/mcp-rate-limit'
import {
  drizzleAvailableCarsForTripDb,
  listAvailableCarsForTrip,
} from '#/lib/available-cars-for-trip'
import { getPublicCarDetail, publicCarDetailToRow } from '#/lib/portal-functions'

const rateLimitState = new Map<string, number[]>()

const MCP_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
}

export type McpRouteHandlerOptions = {
  rateLimitState?: Map<string, number[]>
  rateLimit?: RateLimitConfig
}

async function searchAvailableCarsForTrip(input: { startDate: string; endDate: string }) {
  const { db } = await import('#/db')
  return listAvailableCarsForTrip(drizzleAvailableCarsForTripDb(db), input)
}

function mcpDeps() {
  const siteUrl = publicSiteUrl()
  return {
    siteUrl,
    searchCars: searchAvailableCarsForTrip,
    getCar: async (carId: string) => {
      const detail = await getPublicCarDetail({ data: { carId } })
      return detail ? publicCarDetailToRow(detail) : null
    },
  }
}

function rateLimitResponse(message: string, retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error: 'rate_limit_exceeded',
      message,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(retryAfterSeconds),
        'Cache-Control': 'no-store',
      },
    },
  )
}

export function createMcpRouteHandler(options: McpRouteHandlerOptions = {}) {
  const limitState = options.rateLimitState ?? rateLimitState
  const limit = options.rateLimit ?? MCP_RATE_LIMIT

  return async function mcpRouteHandler(request: Request): Promise<Response> {
    const clientIp = clientIpFromRequest(request)
    const decision = checkIpRateLimit(clientIp, Date.now(), limitState, limit)

    if (!decision.allowed) {
      console.warn(`[mcp] rate limit exceeded for ${clientIp}`)
      return rateLimitResponse(decision.message, decision.retryAfterSeconds)
    }

    return handleMcpHttpRequest(request, mcpDeps())
  }
}

export const mcpRouteHandler = createMcpRouteHandler()
