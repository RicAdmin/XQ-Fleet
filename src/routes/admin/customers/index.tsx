import { createFileRoute } from '@tanstack/react-router'

import CustomersList from '#/components/customers/CustomersList'

export const Route = createFileRoute('/admin/customers/')({
  component: AdminCustomersPage,
})

function AdminCustomersPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }
  return (
    <CustomersList
      session={session}
      basePath="/admin/customers"
      canDelete={true}
    />
  )
}
