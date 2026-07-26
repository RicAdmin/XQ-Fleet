import '@tanstack/react-start/server-only'

import type { AuthSession } from '#/lib/auth'
import { isAppRole } from '#/lib/auth-model'

/** Collapse duplicate positive session lookups during a navigation burst. */
const SESSION_TTL_MS = 5_000
const sessionLookupCache = new Map<
  string,
  { expiresAt: number; promise: Promise<AuthSession | null> }
>()

function sessionCacheKey(cookieHeader: string | null): string | null {
  // Unauthenticated requests share an empty cookie header. Never cache those —
  // a cached null can race with authenticated lookups that briefly omit cookies.
  if (!cookieHeader || !cookieHeader.includes('better-auth.session_token')) {
    return null
  }
  return cookieHeader
}

export async function lookupRequestSession(): Promise<AuthSession | null> {
  const { auth } = await import('#/lib/auth')
  const { getRequestHeaders } = await import('@tanstack/react-start/server')
  const headers = getRequestHeaders()
  const cookie = headers.get('cookie')
  const key = sessionCacheKey(cookie)
  const now = Date.now()

  if (key) {
    const cached = sessionLookupCache.get(key)
    if (cached && cached.expiresAt > now) {
      return cached.promise
    }
  }

  const promise = auth.api
    .getSession({ headers })
    .then((session) => {
      if (!session || !isAppRole(session.user.role)) return null
      return session
    })
    .catch((err) => {
      if (key) sessionLookupCache.delete(key)
      throw err
    })

  // Only cache resolved positive sessions (and in-flight lookups that have a cookie).
  if (key) {
    sessionLookupCache.set(key, { expiresAt: now + SESSION_TTL_MS, promise })
    if (sessionLookupCache.size > 200) {
      for (const [cacheKey, entry] of sessionLookupCache) {
        if (entry.expiresAt <= now) sessionLookupCache.delete(cacheKey)
      }
    }
  }

  const session = await promise
  if (key && !session) {
    sessionLookupCache.delete(key)
  }
  return session
}
