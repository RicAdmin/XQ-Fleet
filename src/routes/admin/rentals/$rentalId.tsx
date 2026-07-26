import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/rentals/$rentalId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/internal/jobs/$jobId',
      params: { jobId: params.rentalId },
    })
  },
})
