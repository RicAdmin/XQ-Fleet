export const appRoles = ['owner', 'staff', 'customer'] as const
export type AppRole = (typeof appRoles)[number]

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
  }
}

export function getHomePathForRole(role: AppRole) {
  switch (role) {
    case 'owner':
      return '/admin' as const
    case 'staff':
      return '/app' as const
    case 'customer':
      return '/account' as const
  }
}

export function getLoginPathForSurface(surface: ProtectedSurface) {
  return surface === 'account' ? ('/login' as const) : ('/internal/login' as const)
}

export function canAccessSurface(role: AppRole, surface: ProtectedSurface) {
  switch (surface) {
    case 'admin':
      return role === 'owner'
    case 'app':
      return role === 'owner' || role === 'staff'
    case 'account':
      return role === 'customer'
  }
}
