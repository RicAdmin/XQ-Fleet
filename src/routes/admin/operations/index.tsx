import { createFileRoute, redirect } from '@tanstack/react-router'

import AdminOperations from '#/components/admin/AdminOperations'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { getOperationsQueue } from '#/lib/rental-functions'

const OPERATIONS_STALE_MS = 60_000

export const Route = createFileRoute('/admin/operations/')({
  staleTime: OPERATIONS_STALE_MS,
  beforeLoad: async ({ context, cause }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session) {
      if (cause === 'preload') return
      throw redirect({ to: '/internal/login' })
    }
    const initialQueue = await getOperationsQueue()
    return { initialQueue }
  },
  component: AdminOperationsPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load operations"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

function AdminOperationsPage() {
  const { session, initialQueue } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialQueue: Awaited<ReturnType<typeof getOperationsQueue>>
  }
  return <AdminOperations session={session} initialQueue={initialQueue} />
}
