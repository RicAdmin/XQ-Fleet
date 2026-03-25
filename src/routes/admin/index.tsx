import { createFileRoute, redirect } from '@tanstack/react-router'

import AdminDashboard from '#/components/dashboard/AdminDashboard'
import { getStaffDirectory } from '#/lib/auth-functions'
import type { DashboardData, OwnerStats } from '#/lib/dashboard-functions'
import { getDashboardData, getOwnerStats } from '#/lib/dashboard-functions'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as { session: { user: { role: string; name: string; email: string } } }
    if (session.user.role !== 'owner') {
      throw redirect({ to: '/admin/cars' })
    }
    const [data, ownerStats, directory] = await Promise.all([
      getDashboardData(),
      getOwnerStats(),
      getStaffDirectory(),
    ])
    return { data, ownerStats, directory }
  },
  component: AdminIndexPage,
})

type StaffRow = { id: string; name: string; email: string; createdAt: Date; status: 'active' | 'deactivated' }
type InvitationRow = { id: string; email: string; createdAt: Date; expiresAt: Date }

function AdminIndexPage() {
  const { session, data, ownerStats, directory } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    data: DashboardData
    ownerStats: OwnerStats
    directory: { staffUsers: StaffRow[]; pendingInvitations: InvitationRow[] }
  }
  return (
    <AdminDashboard
      session={session}
      data={data}
      ownerStats={ownerStats}
      directory={directory}
    />
  )
}
