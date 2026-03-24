import { createFileRoute } from '@tanstack/react-router'

import type { CustomerRow } from '#/components/customers/CustomersList'
import RentalsList from '#/components/rentals/RentalsList'
import { getCustomers } from '#/lib/customer-functions'
import type { AvailableCarOption, RentalListRow } from '#/lib/rental-functions'
import { getAvailableCars, getRentals } from '#/lib/rental-functions'

export const Route = createFileRoute('/admin/rentals/')({
  beforeLoad: async () => {
    const [rentals, availableCars, customers] = await Promise.all([
      getRentals(),
      getAvailableCars(),
      getCustomers(),
    ])
    return { rentals, availableCars, customers }
  },
  component: AdminRentalsPage,
})

function AdminRentalsPage() {
  const { session, rentals, availableCars, customers } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    rentals: RentalListRow[]
    availableCars: AvailableCarOption[]
    customers: CustomerRow[]
  }
  return (
    <RentalsList
      initialRentals={rentals}
      availableCars={availableCars}
      allCustomers={customers}
      session={session}
      basePath="/admin/rentals"
      canDelete={true}
    />
  )
}
