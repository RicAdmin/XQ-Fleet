import { useState } from 'react'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { CalendarDays, Car, CreditCard } from 'lucide-react'

import { AdminKpiGrid } from '#/components/admin/AdminKpiGrid'
import { BookingsTab } from '#/components/admin/BookingsTab'
import { CarsTab } from '#/components/admin/CarsTab'
import { PaymentsTab } from '#/components/admin/PaymentsTab'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { KpiSkeleton } from '#/components/ui/KpiSkeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
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

function AdminIndexPage() {
  const { session, kpis } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    kpis: AdminDashboardKpis
  }
  const [tab, setTab] = useState<TabKey>('bookings')

  return (
    <AdminSidebarShell user={session.user} pageTitle="Dashboard">
      <AdminKpiGrid kpis={kpis} />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabKey)}
        className="gap-3"
      >
        <TabsList variant="pill">
          <TabsTrigger value="bookings">
            <CalendarDays size={17} />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard size={17} />
            Payments
          </TabsTrigger>
          <TabsTrigger value="cars">
            <Car size={17} />
            Cars
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="mt-0">
          <BookingsTab />
        </TabsContent>
        <TabsContent value="payments" className="mt-0">
          <PaymentsTab />
        </TabsContent>
        <TabsContent value="cars" className="mt-0">
          <CarsTab />
        </TabsContent>
      </Tabs>
    </AdminSidebarShell>
  )
}
