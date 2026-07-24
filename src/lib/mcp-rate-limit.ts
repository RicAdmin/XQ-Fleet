export type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

export type RateLimitAllowed = {
  allowed: true
}

export type RateLimitDenied = {
  allowed: false
  message: string
  retryAfterSeconds: number
}

export type RateLimitResult = RateLimitAllowed | RateLimitDenied

/**
 * Sliding-window IP rate limiter for the public MCP PoC.
 * Pure function: callers pass mutable state for testability.
 */
export function checkIpRateLimit(
  clientIp: string,
  nowMs: number,
  state: Map<string, number[]>,
  config: RateLimitConfig,
): RateLimitResult {
  const timestamps = state.get(clientIp) ?? []
  const windowStart = nowMs - config.windowMs
  const recent = timestamps.filter((ts) => ts > windowStart)

  if (recent.length >= config.maxRequests) {
    const oldest = recent[0] ?? nowMs
    const retryAfterMs = Math.max(oldest + config.windowMs - nowMs, 1)
    return {
      allowed: false,
      message: 'Rate limit exceeded for this IP. Retry later.',
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  recent.push(nowMs)
  state.set(clientIp, recent)
  return { allowed: true }
}

export function clientIpFromRequest(request: Request): string {
  const netlifyIp = request.headers.get('x-nf-client-connection-ip')
  if (netlifyIp) return netlifyIp

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  return 'unknown'
}
