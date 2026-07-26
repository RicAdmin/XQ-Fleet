import { createFileRoute } from '@tanstack/react-router'

import AdminAvailability from '#/components/admin/AdminAvailability'
import {
  getFleetAvailability,
  type AvailabilityCarRow,
  type FleetAvailabilitySummary,
} from '#/lib/availability-functions'

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysYmd(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export const Route = createFileRoute('/admin/availability/')({
  beforeLoad: async () => {
    const startDate = todayYmd()
    const endDate = addDaysYmd(3)
    const initial = await getFleetAvailability({
      data: { startDate, endDate },
    })
    return {
      initialStartDate: startDate,
      initialEndDate: endDate,
      initialSummary: initial.summary,
      initialCars: initial.cars,
    }
  },
  component: AdminAvailabilityPage,
})

function AdminAvailabilityPage() {
  const {
    session,
    initialStartDate,
    initialEndDate,
    initialSummary,
    initialCars,
  } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialStartDate: string
    initialEndDate: string
    initialSummary: FleetAvailabilitySummary
    initialCars: AvailabilityCarRow[]
  }
  return (
    <AdminAvailability
      session={session}
      initialStartDate={initialStartDate}
      initialEndDate={initialEndDate}
      initialSummary={initialSummary}
      initialCars={initialCars}
    />
  )
}
