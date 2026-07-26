import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/internal/job/$jobId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/internal/jobs/$jobId',
      params: { jobId: params.jobId },
    })
  },
})
