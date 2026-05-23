import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  /** Same-origin in the browser; avoids mismatched auth API base in dev/prod. */
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
})
