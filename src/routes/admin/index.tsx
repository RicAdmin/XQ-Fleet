import { createFileRoute, redirect } from '@tanstack/react-router'

import {
  getDefaultHomePathForPersona,
  resolveDashboardPersona,
  staffProfileFromSessionUser,
  type AppRole,
} from '#/lib/auth-model'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; staffProfile?: string | null } }
    }
    const role = session.user.role as AppRole
    const persona = resolveDashboardPersona({
      role,
      staffProfile: staffProfileFromSessionUser(session.user),
    })
    throw redirect({ to: getDefaultHomePathForPersona(persona) })
  },
})
