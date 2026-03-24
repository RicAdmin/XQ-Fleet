import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import CustomerProfile from '#/components/customers/CustomerProfile'
import type { CustomerRow } from '#/components/customers/CustomersList'
import { getCustomerById } from '#/lib/customer-functions'

export const Route = createFileRoute('/admin/customers/$customerId')({
  beforeLoad: async ({ params }) => {
    const customer = await getCustomerById({ data: { customerId: params.customerId } })
    if (!customer) throw notFound()
    return { customer }
  },
  component: AdminCustomerDetailPage,
})

function AdminCustomerDetailPage() {
  const { session, customer } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    customer: CustomerRow
  }
  const navigate = useNavigate()

  return (
    <CustomerProfile
      initialCustomer={customer}
      session={session}
      listPath="/admin/customers"
      canDelete={true}
      onDeleted={() => navigate({ to: '/admin/customers' })}
    />
  )
}
