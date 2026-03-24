import { createFileRoute, notFound } from '@tanstack/react-router'

import RentalDetail from '#/components/rentals/RentalDetail'
import type { RentalFullRow } from '#/lib/rental-functions'
import { getRentalById } from '#/lib/rental-functions'

export const Route = createFileRoute('/admin/rentals/$rentalId')({
  beforeLoad: async ({ params }) => {
    const rental = await getRentalById({ data: { rentalId: params.rentalId } })
    if (!rental) throw notFound()
    return { rental }
  },
  component: AdminRentalDetailPage,
})

function AdminRentalDetailPage() {
  const { session, rental } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    rental: RentalFullRow
  }
  return (
    <RentalDetail
      initialRental={rental}
      session={session}
      listPath="/admin/rentals"
      canDelete={true}
    />
  )
}
