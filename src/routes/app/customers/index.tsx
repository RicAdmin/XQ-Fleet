import { createFileRoute } from '@tanstack/react-router'

import CustomersList from '#/components/customers/CustomersList'

export const Route = createFileRoute('/app/customers/')({
  component: AppCustomersPage,
})

function AppCustomersPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }
  return (
    <CustomersList
      session={session}
      basePath="/app/customers"
      canDelete={false}
    />
  )
}
