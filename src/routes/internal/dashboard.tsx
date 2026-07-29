import { createFileRoute } from '@tanstack/react-router'

import CsDashboard from '#/components/admin/CsDashboard'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { getCsDashboard, type CsDashboardPayload } from '#/lib/cs-dashboard-functions'

const CS_DASHBOARD_STALE_MS = 30_000

export const Route = createFileRoute('/internal/dashboard')({
  staleTime: CS_DASHBOARD_STALE_MS,
  beforeLoad: async () => {
    const initialData = await getCsDashboard()
    return { initialData }
  },
  component: CsDashboardPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load dashboard"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function CsDashboardPage() {
  const { session, initialData } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialData: CsDashboardPayload
  }
  return <CsDashboard session={session} initialData={initialData} />
}
