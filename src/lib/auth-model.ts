import { DEFAULT_LOCALE } from '#/i18n/locales'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'

export const appRoles = ['owner', 'staff', 'customer', 'super_admin'] as const
export type AppRole = (typeof appRoles)[number]

export const staffProfiles = ['customer_service', 'operations', 'account'] as const
export type StaffProfile = (typeof staffProfiles)[number]

/** UI persona that drives sidebar menus (CS desk vs ops floor vs full admin). */
export type DashboardPersona = 'customer_service' | 'operations' | 'account' | 'admin'

/** Super admin header toggle — preview CS, Ops, or full Admin menus without changing DB role. */
export type AdminViewMode = 'customer_service' | 'operations' | 'admin'

/** Roles that may access /admin/* routes (owner-level or above). */
export const adminPanelRoles: ReadonlyArray<AppRole> = ['owner', 'staff', 'super_admin']

/** Roles with full admin privileges (promos, affiliates, settings, fleet config). */
export const fullAdminRoles: ReadonlyArray<AppRole> = ['owner', 'super_admin']

/** Roles that can run day-to-day fleet ops (cars, customers, rentals). */
export const fleetOpsRoles: ReadonlyArray<AppRole> = ['owner', 'staff', 'super_admin']

export const protectedSurfaces = ['admin', 'app', 'account'] as const
export type ProtectedSurface = (typeof protectedSurfaces)[number]

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && appRoles.includes(value as AppRole)
}

export function isStaffProfile(value: unknown): value is StaffProfile {
  return typeof value === 'string' && staffProfiles.includes(value as StaffProfile)
}

export function staffProfileFromSessionUser(user: unknown): StaffProfile {
  if (!user || typeof user !== 'object' || !('staffProfile' in user)) {
    return 'customer_service'
  }
  const value = (user as { staffProfile: unknown }).staffProfile
  return isStaffProfile(value) ? value : 'customer_service'
}

export function resolveDashboardPersona(opts: {
  role: AppRole
  staffProfile?: StaffProfile | null
  viewMode?: AdminViewMode | null
}): DashboardPersona {
  const viewMode = opts.viewMode ?? 'admin'
  if (opts.role === 'owner' || opts.role === 'super_admin') {
    if (opts.role === 'super_admin') {
      if (viewMode === 'customer_service') return 'customer_service'
      if (viewMode === 'operations') return 'operations'
    }
    return 'admin'
  }

  if (opts.role === 'staff') {
    if (opts.staffProfile === 'operations') return 'operations'
    if (opts.staffProfile === 'account') return 'account'
    return 'customer_service'
  }

  return 'customer_service'
}

export function getDefaultHomePathForPersona(persona: DashboardPersona): string {
  if (persona === 'account') return '/admin/accounts'
  return INTERNAL_JOBS_PATH
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

export function getStaffProfileLabel(profile: StaffProfile) {
  switch (profile) {
    case 'customer_service':
      return 'Customer Service'
    case 'operations':
      return 'Operations'
    case 'account':
      return 'Accounts'
  }
}

export function getHomePathForRole(
  role: AppRole,
  staffProfile: StaffProfile = 'customer_service',
) {
  switch (role) {
    case 'customer':
      return '/' as const
    case 'staff':
      return getDefaultHomePathForPersona(
        staffProfile === 'operations'
          ? 'operations'
          : staffProfile === 'account'
            ? 'account'
            : 'customer_service',
      )
    case 'owner':
    case 'super_admin':
      return getDefaultHomePathForPersona('admin')
  }
}

/** Locale-prefixed customer sign-in (not `/login`, which is staff-only). */
export const customerLoginPath = `/${DEFAULT_LOCALE}/login` as const

export function getLoginPathForSurface(surface: ProtectedSurface) {
  return surface === 'account'
    ? customerLoginPath
    : ('/internal/login' as const)
}

export function canAccessSurface(role: AppRole, surface: ProtectedSurface) {
  switch (surface) {
    case 'admin':
      return role === 'owner' || role === 'staff' || role === 'super_admin'
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

/** Session user from better-auth client may omit fields until inferAdditionalFields is wired. */
export function appRoleFromSessionUser(user: unknown): AppRole | null {
  if (!user || typeof user !== 'object' || !('role' in user)) return null
  const value = (user as { role: unknown }).role
  return isAppRole(value) ? value : null
}

export function canManageJobs(persona: DashboardPersona): boolean {
  return persona === 'customer_service' || persona === 'admin'
}

export function canMutateJobLifecycle(persona: DashboardPersona): boolean {
  return persona === 'operations' || persona === 'admin' || persona === 'customer_service'
}
