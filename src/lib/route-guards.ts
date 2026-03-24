import { redirect } from '@tanstack/react-router'
import type { ProtectedSurface } from '#/lib/auth-model'

import {
  canAccessSurface,
  getHomePathForRole,
  getLoginPathForSurface,
} from '#/lib/auth-model'
import { getCurrentSession, getOwnerSetupState } from '#/lib/auth-functions'

export async function redirectAuthenticatedUser() {
  const session = await getCurrentSession()

  if (session) {
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return null
}

export async function requireInternalAccess() {
  const session = await getCurrentSession()

  if (!session) {
    throw redirect({ to: '/internal/login' })
  }

  if (session.user.role === 'customer') {
    throw redirect({ to: '/account' })
  }

  return { session }
}

export async function requireSurfaceAccess(surface: ProtectedSurface) {
  const session = await getCurrentSession()

  if (!session) {
    throw redirect({ to: getLoginPathForSurface(surface) })
  }

  if (!canAccessSurface(session.user.role, surface)) {
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return { session }
}

export async function loadInternalLoginState() {
  const session = await getCurrentSession()

  if (session) {
    throw redirect({ to: getHomePathForRole(session.user.role) })
  }

  return getOwnerSetupState()
}
