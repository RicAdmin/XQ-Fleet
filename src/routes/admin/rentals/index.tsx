import { createFileRoute } from '@tanstack/react-router'

import type { CustomerRow } from '#/components/customers/CustomersList'
import RentalsList from '#/components/rentals/RentalsList'
import { asDate } from '#/lib/as-date'
import { getCustomers } from '#/lib/customer-functions'
import type { AvailableCarOption, RentalListRow } from '#/lib/rental-functions'
import { getAvailableCars, getRentals } from '#/lib/rental-functions'

function normalizeRental(row: RentalListRow): RentalListRow {
  return {
    ...row,
    startDate: asDate(row.startDate),
    endDate: asDate(row.endDate),
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt),
  }
}

export const Route = createFileRoute('/admin/rentals/')({
  beforeLoad: async () => {
    const [rentalRows, availableCars, customerRows] = await Promise.all([
      getRentals(),
      getAvailableCars(),
      getCustomers(),
    ])
    const rentals = rentalRows.map(normalizeRental)
    const customers = customerRows.map((c) => ({
      ...c,
      createdAt: asDate(c.createdAt),
      updatedAt: asDate(c.updatedAt),
    }))
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
