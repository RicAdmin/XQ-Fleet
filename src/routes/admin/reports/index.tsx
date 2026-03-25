import { createFileRoute, redirect } from '@tanstack/react-router'

import AdminReports from '#/components/reports/AdminReports'
import type { CarSelectRow, RevenueReport } from '#/lib/report-functions'
import { getCarsForSelect, getRevenueReport } from '#/lib/report-functions'

function thisMonthRange(): [string, string] {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return [from.toISOString().split('T')[0], to.toISOString().split('T')[0]]
}

export const Route = createFileRoute('/admin/reports/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as { session: { user: { role: string; name: string; email: string } } }
    if (session.user.role !== 'owner') {
      throw redirect({ to: '/admin/cars' })
    }
    const [from, to] = thisMonthRange()
    const [initialRevenue, allCars] = await Promise.all([
      getRevenueReport({ data: { from, to } }),
      getCarsForSelect(),
    ])
    return { initialRevenue, allCars }
  },
  component: AdminReportsPage,
})

function AdminReportsPage() {
  const { session, initialRevenue, allCars } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialRevenue: RevenueReport
    allCars: CarSelectRow[]
  }
  return <AdminReports session={session} initialRevenue={initialRevenue} allCars={allCars} />
}
