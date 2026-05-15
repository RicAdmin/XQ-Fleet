import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/account/bookings/')({
  beforeLoad: () => {
    throw redirect({ to: '/account/rentals' })
  },
  component: () => null,
})
