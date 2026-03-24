import { createFileRoute } from '@tanstack/react-router'

import CustomersList from '#/components/customers/CustomersList'
import type { CustomerRow } from '#/components/customers/CustomersList'
import { getCustomers } from '#/lib/customer-functions'

export const Route = createFileRoute('/admin/customers/')({
  beforeLoad: async () => {
    const customers = await getCustomers()
    return { customers }
  },
  component: AdminCustomersPage,
})

function AdminCustomersPage() {
  const { session, customers } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    customers: CustomerRow[]
  }
  return (
    <CustomersList
      initialCustomers={customers}
      session={session}
      basePath="/admin/customers"
      canDelete={true}
    />
  )
}
