import { createFileRoute, notFound } from '@tanstack/react-router'

import RentalDetail from '#/components/rentals/RentalDetail'
import { useJobMode } from '#/hooks/use-job-mode'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'
import { isFullAdminRole, type AppRole } from '#/lib/auth-model'
import type { RentalFullRow } from '#/lib/rental-functions'
import { getRentalById } from '#/lib/rental-functions'

export const Route = createFileRoute('/internal/jobs/$jobId')({
  beforeLoad: async ({ params }) => {
    const rental = await getRentalById({ data: { rentalId: params.jobId } })
    if (!rental) throw notFound()
    return { rental }
  },
  component: InternalJobDetailPage,
})

function InternalJobDetailPage() {
  const { session, rental } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string; staffProfile?: string | null } }
    rental: RentalFullRow
  }

  const role = session.user.role as AppRole
  const jobMode = useJobMode(session.user)
  const listPath = jobMode === 'operations' ? '/admin/operations' : INTERNAL_JOBS_PATH
  const backLabel = jobMode === 'operations' ? 'Back to operation' : 'Back to jobs'

  return (
    <RentalDetail
      initialRental={rental}
      session={session}
      listPath={listPath}
      backLabel={backLabel}
      jobMode={jobMode}
      canDelete={isFullAdminRole(role) && jobMode === 'manage'}
    />
  )
}
