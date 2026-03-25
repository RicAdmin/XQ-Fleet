import { createFileRoute } from '@tanstack/react-router'

import StaffDashboard from '#/components/dashboard/StaffDashboard'
import type { DashboardData } from '#/lib/dashboard-functions'
import { getDashboardData } from '#/lib/dashboard-functions'

export const Route = createFileRoute('/app/')({
  beforeLoad: async () => {
    const data = await getDashboardData()
    return { data }
  },
  component: StaffAppPage,
})

function StaffAppPage() {
  const { session, data } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    data: DashboardData
  }
  return <StaffDashboard user={session.user} data={data} />
}
