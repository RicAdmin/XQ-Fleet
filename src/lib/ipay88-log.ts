const REDACTED_KEYS = new Set(['Signature', 'MerchantKey'])

/** Strip secrets before writing iPay88 payloads to server logs. */
export function sanitizeIpay88Fields(
  fields: Record<string, string | undefined | null>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === '') continue
    out[key] = REDACTED_KEYS.has(key) ? '[redacted]' : value
  }
  return out
}

export function logIpay88(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({
      level,
      message: `[iPay88] ${message}`,
      data: data ?? {},
    }),
  )
}

export function logIpay88Error(message: string, err: unknown, data?: Record<string, unknown>): void {
  logIpay88('error', message, {
    ...data,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  })
}
