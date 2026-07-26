import { createFileRoute, redirect } from '@tanstack/react-router'

import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'

/** Singular alias — keeps bookmarks and typos on `/internal/job`. */
export const Route = createFileRoute('/internal/job')({
  beforeLoad: () => {
    throw redirect({ to: INTERNAL_JOBS_PATH })
  },
})
