import {
  appRoleFromSessionUser,
  resolveDashboardPersona,
  staffProfileFromSessionUser,
  type AdminViewMode,
  type DashboardPersona,
} from '#/lib/auth-model'

const ADMIN_VIEW_MODE_KEY = 'xqcar.adminViewMode'

function readSuperAdminViewMode(): AdminViewMode | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(ADMIN_VIEW_MODE_KEY)
  if (raw === 'customer_service' || raw === 'operations' || raw === 'admin') return raw
  return null
}

export function resolveJobMode(opts: {
  user: unknown
  viewMode?: AdminViewMode | null
}): 'manage' | 'operations' {
  const role = appRoleFromSessionUser(opts.user) ?? 'staff'
  const persona = resolveDashboardPersona({
    role,
    staffProfile: staffProfileFromSessionUser(opts.user),
    viewMode: opts.viewMode,
  })
  return persona === 'operations' ? 'operations' : 'manage'
}

export function resolveJobModeFromUser(user: unknown): 'manage' | 'operations' {
  const role = appRoleFromSessionUser(user) ?? 'staff'
  const viewMode = role === 'super_admin' ? readSuperAdminViewMode() : null
  return resolveJobMode({ user, viewMode })
}

export function resolvePersonaFromUser(user: unknown): DashboardPersona {
  const role = appRoleFromSessionUser(user) ?? 'staff'
  return resolveDashboardPersona({
    role,
    staffProfile: staffProfileFromSessionUser(user),
  })
}
