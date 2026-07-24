import { createFileRoute } from '@tanstack/react-router'

import type { CustomerRow } from '#/components/customers/CustomersList'
import RentalsList from '#/components/rentals/RentalsList'
import { asDate } from '#/lib/as-date'
import { getCustomers } from '#/lib/customer-functions'
import type { AvailableCarOption } from '#/lib/rental-functions'
import { getAvailableCars } from '#/lib/rental-functions'

export const Route = createFileRoute('/admin/rentals/')({
  beforeLoad: async () => {
    const [availableCars, customerRows] = await Promise.all([
      getAvailableCars(),
      getCustomers(),
    ])
    const customers = customerRows.map((c) => ({
      ...c,
      createdAt: asDate(c.createdAt),
      updatedAt: asDate(c.updatedAt),
    }))
    return { availableCars, customers }
  },
  component: AdminRentalsPage,
})

function AdminRentalsPage() {
  const { session, availableCars, customers } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    availableCars: AvailableCarOption[]
    customers: CustomerRow[]
  }
  return (
    <RentalsList
      availableCars={availableCars}
      allCustomers={customers}
      session={session}
      basePath="/admin/rentals"
      canDelete={true}
    />
  )
}
