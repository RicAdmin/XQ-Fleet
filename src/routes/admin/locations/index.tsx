import { createFileRoute, notFound } from '@tanstack/react-router'

import AdminLocations from '#/components/admin/AdminLocations'
import { fullAdminRoles, isAppRole } from '#/lib/auth-model'

export const Route = createFileRoute('/admin/locations/')({
  beforeLoad: ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session || !isAppRole(session.user.role) || !fullAdminRoles.includes(session.user.role)) {
      throw notFound()
    }
  },
  component: AdminLocationsPage,
})

function AdminLocationsPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }
  return <AdminLocations session={session} />
}
