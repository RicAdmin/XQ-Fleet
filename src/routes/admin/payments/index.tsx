import { createFileRoute, redirect } from '@tanstack/react-router'

import { PaymentsTab } from '#/components/admin/PaymentsTab'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'

export const Route = createFileRoute('/admin/payments/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session) throw redirect({ to: '/internal/login' })
  },
  component: AdminPaymentsPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load payments"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function AdminPaymentsPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle="Payments">
      <PageHeader
        kicker="Finance"
        title="Payments"
        description="Payment transactions across bookings and rentals."
      />
      <PaymentsTab />
    </AdminSidebarShell>
  )
}
