import { notFound, redirect } from '@tanstack/react-router'
import type { AppRole, ProtectedSurface } from '#/lib/auth-model'

import {
  adminPanelRoles,
  canAccessSurface,
  fullAdminRoles,
  getHomePathForRole,
  getLoginPathForSurface,
} from '#/lib/auth-model'
import { getRequestSession, getOwnerSetupState } from '#/lib/auth-functions'

/** TanStack Router beforeLoad `cause` — preload must never commit auth redirects. */
export type RouteLoadCause = 'preload' | 'enter' | 'stay'

export async function redirectAuthenticatedUser(opts?: { returnTo?: string }) {
  const session = await getRequestSession()

  if (session) {
    const returnTo = opts?.returnTo?.trim()
    if (returnTo && session.user.role === 'customer') {
      throw redirect({ href: returnTo })
    }
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return null
}

export async function requireInternalAccess(opts: { cause?: RouteLoadCause } = {}) {
  const session = await getRequestSession()

  if (!session) {
    // Hover/intent preload can run without cookies or before sign-in completes.
    // Never write session:null into route context — that poisons the cached match.
    if (opts.cause === 'preload') return
    throw redirect({ to: '/internal/login' })
  }

  if (session.user.role === 'customer') {
    if (opts.cause === 'preload') return
    throw redirect({ to: '/account' })
  }

  return { session }
}

export async function requireSurfaceAccess(
  surface: ProtectedSurface,
  opts: { cause?: RouteLoadCause } = {},
) {
  const session = await getRequestSession()

  if (!session) {
    if (opts.cause === 'preload') return
    throw redirect({ to: getLoginPathForSurface(surface) })
  }

  if (!canAccessSurface(session.user.role, surface)) {
    if (opts.cause === 'preload') return
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return { session }
}

export async function loadInternalLoginState() {
  const session = await getRequestSession()

  if (session) {
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return getOwnerSetupState()
}

type RequireAdminAccessOptions = {
  /** Override allowed roles. Defaults to operational admin roles (owner/staff/super_admin). */
  allow?: ReadonlyArray<AppRole>
  cause?: RouteLoadCause
}

/**
 * Guard for /admin/* routes.
 *
 * - No session → `/internal/login` (staff entry; does not touch customer auth).
 * - Wrong role → `notFound()` so the admin surface is not enumerable.
 * - Preload with no session → soft miss (no redirect) so hover does not log users out.
 *
 * Default `allow` covers operational pages (bookings/cars/customers). Pass
 * `{ allow: fullAdminRoles }` for privileged surfaces like promos, affiliates,
 * and settings.
 */
export async function requireAdminAccess(opts: RequireAdminAccessOptions = {}) {
  const allowed = opts.allow ?? adminPanelRoles
  const session = await getRequestSession()

  if (!session) {
    if (opts.cause === 'preload') return
    throw redirect({ to: '/internal/login' })
  }

  if (!allowed.includes(session.user.role)) {
    if (opts.cause === 'preload') return
    throw notFound()
  }

  return { session }
}

/** Shortcut: throw 404 unless the visitor is a full admin (owner / super_admin). */
export async function requireFullAdminAccess(opts: { cause?: RouteLoadCause } = {}) {
  return requireAdminAccess({ allow: fullAdminRoles, cause: opts.cause })
}
