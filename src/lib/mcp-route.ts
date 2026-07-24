import { handleMcpHttpRequest } from '#/lib/mcp-server'
import { createAgentToolDeps } from '#/lib/agent-tool-deps'
import {
  checkIpRateLimit,
  clientIpFromRequest,
  type RateLimitConfig,
} from '#/lib/mcp-rate-limit'

const rateLimitState = new Map<string, number[]>()

const MCP_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
}

export type McpRouteHandlerOptions = {
  rateLimitState?: Map<string, number[]>
  rateLimit?: RateLimitConfig
}

function rateLimitResponse(
  message: string,
  retryAfterSeconds: number,
): Response {
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

    return handleMcpHttpRequest(request, createAgentToolDeps())
  }
}

export const mcpRouteHandler = createMcpRouteHandler()
