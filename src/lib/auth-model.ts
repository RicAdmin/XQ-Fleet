export const appRoles = ['owner', 'staff', 'customer', 'super_admin'] as const
export type AppRole = (typeof appRoles)[number]

/** Roles that may access /admin/* routes (owner-level or above). */
export const adminPanelRoles: ReadonlyArray<AppRole> = ['owner', 'staff', 'super_admin']

/** Roles with full admin privileges (promos, affiliates, settings). */
export const fullAdminRoles: ReadonlyArray<AppRole> = ['owner', 'super_admin']

/** Roles that can run day-to-day fleet ops (cars, customers, rentals). */
export const fleetOpsRoles: ReadonlyArray<AppRole> = ['owner', 'staff', 'super_admin']

export const protectedSurfaces = ['admin', 'app', 'account'] as const
export type ProtectedSurface = (typeof protectedSurfaces)[number]

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && appRoles.includes(value as AppRole)
}

export function getRoleLabel(role: AppRole) {
  switch (role) {
    case 'owner':
      return 'Owner'
    case 'staff':
      return 'Staff'
    case 'customer':
      return 'Customer'
    case 'super_admin':
      return 'Super Admin'
  }
}

export function getHomePathForRole(role: AppRole) {
  switch (role) {
    case 'owner':
    case 'super_admin':
      return '/admin' as const
    case 'staff':
      return '/app' as const
    case 'customer':
      return '/' as const
  }
}

export function getLoginPathForSurface(surface: ProtectedSurface) {
  return surface === 'account' ? ('/login' as const) : ('/internal/login' as const)
}

export function canAccessSurface(role: AppRole, surface: ProtectedSurface) {
  switch (surface) {
    case 'admin':
      return role === 'owner' || role === 'super_admin'
    case 'app':
      return role === 'owner' || role === 'staff' || role === 'super_admin'
    case 'account':
      return role === 'customer'
  }
}

export function isAdminPanelRole(role: AppRole): boolean {
  return adminPanelRoles.includes(role)
}

export function isFullAdminRole(role: AppRole): boolean {
  return fullAdminRoles.includes(role)
}

/** Session user from better-auth client may omit `role` in types until inferAdditionalFields is wired. */
export function appRoleFromSessionUser(user: unknown): AppRole | null {
  if (!user || typeof user !== 'object' || !('role' in user)) return null
  const value = (user as { role: unknown }).role
  return isAppRole(value) ? value : null
}
