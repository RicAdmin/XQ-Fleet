import { createFileRoute, redirect } from '@tanstack/react-router'

import { AdminAccounts } from '#/components/admin/AdminAccounts'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { listJobsForAccounts, type AccountJobRow } from '#/lib/account-functions'

export const Route = createFileRoute('/admin/accounts/')({
  beforeLoad: async ({ context, cause }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session) {
      if (cause === 'preload') return
      throw redirect({ to: '/internal/login' })
    }
    const initialRows = await listJobsForAccounts()
    return { initialRows }
  },
  component: AdminAccountsPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load accounts"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function AdminAccountsPage() {
  const { session, initialRows } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialRows: AccountJobRow[]
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle="Accounts">
      <PageHeader
        kicker="Finance"
        title="Jobs for accounts"
        description="Monitor payments and process deposit refunds for closed jobs."
      />
      <AdminAccounts initialRows={initialRows} />
    </AdminSidebarShell>
  )
}
