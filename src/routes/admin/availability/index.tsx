import { createFileRoute } from '@tanstack/react-router'

import AdminAvailability from '#/components/admin/AdminAvailability'
import {
  getFleetAvailability,
  type AvailabilityCarRow,
} from '#/lib/availability-functions'

export const Route = createFileRoute('/admin/availability/')({
  beforeLoad: async () => {
    const initial = await getFleetAvailability({ data: {} })
    return {
      initialCars: initial.cars,
    }
  },
  component: AdminAvailabilityPage,
})

function AdminAvailabilityPage() {
  const { session, initialCars } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialCars: AvailabilityCarRow[]
  }
  return <AdminAvailability session={session} initialCars={initialCars} />
}
