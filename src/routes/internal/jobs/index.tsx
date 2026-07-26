import { createFileRoute } from '@tanstack/react-router'

import RentalsList from '#/components/rentals/RentalsList'
import { useJobMode } from '#/hooks/use-job-mode'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'
import { isFullAdminRole, type AppRole } from '#/lib/auth-model'
import { listRentals, type RentalListResult } from '#/lib/rental-functions'

const JOBS_PAGE_SIZE = 25
/** Match router defaultPreloadStaleTime — instant back nav from job detail. */
const JOBS_LIST_STALE_MS = 60_000

export const Route = createFileRoute('/internal/jobs/')({
  staleTime: JOBS_LIST_STALE_MS,
  beforeLoad: async () => {
    const initialResult = await listRentals({
      data: {
        page: 1,
        pageSize: JOBS_PAGE_SIZE,
        sortKey: 'startDate',
        sortDir: 'desc',
        includeStatusCounts: true,
      },
    })

    return {
      initialResult,
      initialStatusCounts: initialResult.statusCounts ?? { all: initialResult.total },
    }
  },
  component: InternalJobsPage,
})

function InternalJobsPage() {
  const { session, initialResult, initialStatusCounts } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string; staffProfile?: string | null } }
    initialResult: RentalListResult
    initialStatusCounts: Record<string, number>
  }

  const role = session.user.role as AppRole
  const jobMode = useJobMode(session.user)

  return (
    <RentalsList
      initialResult={initialResult}
      initialStatusCounts={initialStatusCounts}
      session={session}
      basePath={INTERNAL_JOBS_PATH}
      canDelete={isFullAdminRole(role)}
      jobMode={jobMode}
    />
  )
}
