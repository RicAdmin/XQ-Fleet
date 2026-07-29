/** Staff sign-in surface (public). */
export const INTERNAL_LOGIN_PATH = '/internal/login' as const

/** Canonical jobs list for CS, ops, and admin after internal login. */
export const INTERNAL_JOBS_PATH = '/internal/jobs' as const

export function isPublicInternalPath(pathname: string): boolean {
  return pathname === INTERNAL_LOGIN_PATH
}
