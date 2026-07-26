import { createFileRoute, redirect } from '@tanstack/react-router'

import { PaymentsTab } from '#/components/admin/PaymentsTab'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import {
  getAdminPayments,
  type AdminPaymentsResult,
} from '#/lib/admin-dashboard-functions'

const PAGE_SIZE = 25

export const Route = createFileRoute('/admin/payments/')({
  beforeLoad: async ({ context, cause }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session) {
      if (cause === 'preload') return
      throw redirect({ to: '/internal/login' })
    }
    const initialResult = await getAdminPayments({
      data: { page: 1, pageSize: PAGE_SIZE },
    })
    return { initialResult }
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
  const { session, initialResult } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialResult: AdminPaymentsResult
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle="Payments">
      <PageHeader
        kicker="Finance"
        title="Payment"
        description="Payment transactions across jobs and bookings."
      />
      <PaymentsTab initialResult={initialResult} />
    </AdminSidebarShell>
  )
}
