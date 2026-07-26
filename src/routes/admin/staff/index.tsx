import { createFileRoute, notFound } from '@tanstack/react-router'

import AdminStaff from '#/components/admin/AdminStaff'
import { fullAdminRoles, isAppRole } from '#/lib/auth-model'

export const Route = createFileRoute('/admin/staff/')({
  beforeLoad: ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session || !isAppRole(session.user.role) || !fullAdminRoles.includes(session.user.role)) {
      throw notFound()
    }
  },
  component: AdminStaffPage,
})

function AdminStaffPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }
  return <AdminStaff session={session} />
}
