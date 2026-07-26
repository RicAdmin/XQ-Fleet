import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/maintenance/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/maintenance' })
  },
})
