import { useMemo } from 'react'

import { useAdminViewMode } from '#/hooks/use-admin-view-mode'
import { resolveJobMode } from '#/lib/admin-session'
import { appRoleFromSessionUser } from '#/lib/auth-model'

export function useJobMode(user: unknown): 'manage' | 'operations' {
  const role = appRoleFromSessionUser(user)
  const isSuperAdmin = role === 'super_admin'
  const { viewMode } = useAdminViewMode(isSuperAdmin)

  return useMemo(
    () => resolveJobMode({ user, viewMode: isSuperAdmin ? viewMode : null }),
    [user, isSuperAdmin, viewMode],
  )
}
