import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/')({
  beforeLoad: async ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } }
    }
    if (session.user.role !== 'owner' && session.user.role !== 'super_admin') {
      throw redirect({ to: '/admin/cars' })
    }
    throw redirect({ to: '/admin/operations' })
  },
})
