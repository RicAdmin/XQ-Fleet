import { createFileRoute } from '@tanstack/react-router'

import CustomersList from '#/components/customers/CustomersList'
import type { CustomerRow } from '#/components/customers/CustomersList'
import { asDate } from '#/lib/as-date'
import { getCustomers } from '#/lib/customer-functions'

export const Route = createFileRoute('/admin/customers/')({
  beforeLoad: async () => {
    const rows = await getCustomers()
    const customers = rows.map((c) => ({
      ...c,
      createdAt: asDate(c.createdAt),
      updatedAt: asDate(c.updatedAt),
    }))
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
