import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/customers/$customerId')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/admin/customers/$customerId',
      params: { customerId: params.customerId },
    })
  },
})
