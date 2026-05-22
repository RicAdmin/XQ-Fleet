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

export async function redirectAuthenticatedUser() {
  const session = await getRequestSession()

  if (session) {
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return null
}

export async function requireInternalAccess() {
  const session = await getRequestSession()

  if (!session) {
    throw redirect({ to: '/internal/login' })
  }

  if (session.user.role === 'customer') {
    throw redirect({ to: '/account' })
  }

  return { session }
}

export async function requireSurfaceAccess(surface: ProtectedSurface) {
  const session = await getRequestSession()

  if (!session) {
    throw redirect({ to: getLoginPathForSurface(surface) })
  }

  if (!canAccessSurface(session.user.role, surface)) {
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
}

/**
 * Guard for /admin/* routes. Throws `notFound()` (404) for unauthenticated or
 * unauthorized users so the admin surface cannot be enumerated.
 *
 * Default `allow` covers operational pages (bookings/cars/customers). Pass
 * `{ allow: fullAdminRoles }` for privileged surfaces like promos, affiliates,
 * and settings.
 */
export async function requireAdminAccess(opts: RequireAdminAccessOptions = {}) {
  const allowed = opts.allow ?? adminPanelRoles
  const session = await getRequestSession()

  if (!session || !allowed.includes(session.user.role)) {
    throw notFound()
  }

  return { session }
}

/** Shortcut: throw 404 unless the visitor is a full admin (owner / super_admin). */
export async function requireFullAdminAccess() {
  return requireAdminAccess({ allow: fullAdminRoles })
}
