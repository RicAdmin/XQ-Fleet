import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router'

import CustomerProfile from '#/components/customers/CustomerProfile'
import type { CustomerRow } from '#/components/customers/CustomersList'
import { getCustomerById } from '#/lib/customer-functions'

export const Route = createFileRoute('/app/customers/$customerId')({
  beforeLoad: async ({ params }) => {
    const customer = await getCustomerById({ data: { customerId: params.customerId } })
    if (!customer) throw notFound()
    return { customer }
  },
  component: AppCustomerDetailPage,
})

function AppCustomerDetailPage() {
  const { session, customer } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    customer: CustomerRow
  }
  const navigate = useNavigate()

  return (
    <CustomerProfile
      initialCustomer={customer}
      session={session}
      listPath="/app/customers"
      canDelete={false}
      onDeleted={() => navigate({ to: '/app/customers' })}
    />
  )
}
