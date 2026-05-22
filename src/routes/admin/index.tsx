import { useState } from 'react'

import { createFileRoute, redirect } from '@tanstack/react-router'

import { AdminKpiGrid } from '#/components/admin/AdminKpiGrid'
import { BookingsTab } from '#/components/admin/BookingsTab'
import { CarsTab } from '#/components/admin/CarsTab'
import { PaymentsTab } from '#/components/admin/PaymentsTab'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { KpiSkeleton } from '#/components/ui/KpiSkeleton'
import type { AdminDashboardKpis } from '#/lib/admin-dashboard-functions'
import { getAdminDashboardKpis } from '#/lib/admin-dashboard-functions'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } }
    }
    if (session.user.role !== 'owner' && session.user.role !== 'super_admin') {
      throw redirect({ to: '/admin/cars' })
    }
    const kpis = await getAdminDashboardKpis()
    return { kpis }
  },
  component: AdminIndexPage,
  pendingComponent: () => (
    <AdminSidebarShell user={{ name: '', email: '' }} pageTitle="Dashboard">
      <KpiSkeleton cards={5} />
    </AdminSidebarShell>
  ),
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load dashboard"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

type TabKey = 'bookings' | 'payments' | 'cars'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'payments', label: 'Payments' },
  { key: 'cars', label: 'Cars' },
]

function AdminIndexPage() {
  const { session, kpis } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    kpis: AdminDashboardKpis
  }
  const [tab, setTab] = useState<TabKey>('bookings')

  return (
    <AdminSidebarShell user={session.user} pageTitle="Dashboard">
      <AdminKpiGrid kpis={kpis} />

      <div className="status-tabs mb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`status-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'bookings' && <BookingsTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'cars' && <CarsTab />}
    </AdminSidebarShell>
  )
}
