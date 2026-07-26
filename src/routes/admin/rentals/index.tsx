import { createFileRoute, redirect } from '@tanstack/react-router'

import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'

export const Route = createFileRoute('/admin/rentals/')({
  beforeLoad: () => {
    throw redirect({ to: INTERNAL_JOBS_PATH })
  },
})
