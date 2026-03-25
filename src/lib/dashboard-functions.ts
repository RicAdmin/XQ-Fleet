import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, lt, sql } from 'drizzle-orm'

import { cars, customers, rentals } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import type { MaintenanceAlertRow } from '#/lib/maintenance-functions'
import { getMaintenanceDashboardAlerts } from '#/lib/maintenance-functions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FleetCounts = {
  available: number
  reserved: number
  rented: number
  maintenance: number
  damaged: number
  retired: number
}

export type RentalAlertRow = {
  id: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  customerFullName: string | null
  endDate: Date
}

export type OverdueRow = RentalAlertRow & {
  daysOverdue: number
}

export type DashboardData = {
  fleetCounts: FleetCounts
  dueToday: RentalAlertRow[]
  overdue: OverdueRow[]
  maintenanceAlerts: MaintenanceAlertRow[]
}

export type OwnerStats = {
  revenueTodaySen: number
  activeRentalsCount: number
  bookingsThisWeek: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfUTCDay(offsetDays = 0): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d
}

// ─── Server functions ─────────────────────────────────────────────────────────

export const getDashboardData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DashboardData> => {
    await requireRole(['owner', 'staff'])
    const { db } = await import('#/db')

    const todayStart = startOfUTCDay(0)
    const tomorrowStart = startOfUTCDay(1)

    // Fleet counts grouped by status
    const rawCounts = await db
      .select({ status: cars.status, count: sql<number>`count(*)::int` })
      .from(cars)
      .groupBy(cars.status)

    const fleetCounts: FleetCounts = {
      available: 0,
      reserved: 0,
      rented: 0,
      maintenance: 0,
      damaged: 0,
      retired: 0,
    }
    for (const row of rawCounts) {
      if (row.status in fleetCounts) {
        fleetCounts[row.status as keyof FleetCounts] = Number(row.count)
      }
    }

    const [dueToday, overdueRaw, maintenanceAlerts] = await Promise.all([
      // Active rentals due back today
      db
        .select({
          id: rentals.id,
          carPlateNumber: cars.plateNumber,
          carMake: cars.make,
          carModel: cars.model,
          customerFullName: customers.fullName,
          endDate: rentals.endDate,
        })
        .from(rentals)
        .leftJoin(cars, eq(rentals.carId, cars.id))
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .where(and(eq(rentals.status, 'active'), gte(rentals.endDate, todayStart), lt(rentals.endDate, tomorrowStart)))
        .orderBy(rentals.endDate),

      // Active rentals past their end date (overdue), most overdue first
      db
        .select({
          id: rentals.id,
          carPlateNumber: cars.plateNumber,
          carMake: cars.make,
          carModel: cars.model,
          customerFullName: customers.fullName,
          endDate: rentals.endDate,
        })
        .from(rentals)
        .leftJoin(cars, eq(rentals.carId, cars.id))
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .where(and(eq(rentals.status, 'active'), lt(rentals.endDate, todayStart)))
        .orderBy(rentals.endDate),

      // Maintenance alerts (lazy computed)
      getMaintenanceDashboardAlerts(),
    ])

    const overdue: OverdueRow[] = overdueRaw.map((r) => ({
      ...r,
      daysOverdue: Math.max(
        1,
        Math.floor((todayStart.getTime() - r.endDate.getTime()) / 86400000),
      ),
    }))

    return { fleetCounts, dueToday, overdue, maintenanceAlerts }
  },
)

export const getOwnerStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OwnerStats> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const todayStart = startOfUTCDay(0)
    const tomorrowStart = startOfUTCDay(1)
    const weekStart = startOfUTCDay(-7)

    const [revenueResult, activeResult, bookingsResult] = await Promise.all([
      // Revenue today: sum paidAmountSen for rentals closed today
      db
        .select({ total: sql<number>`coalesce(sum(paid_amount_sen), 0)::int` })
        .from(rentals)
        .where(
          and(
            eq(rentals.status, 'closed'),
            gte(rentals.actualReturnDate, todayStart),
            lt(rentals.actualReturnDate, tomorrowStart),
          ),
        ),

      // Active rentals count
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(rentals)
        .where(eq(rentals.status, 'active')),

      // Bookings created in the last 7 days
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(rentals)
        .where(gte(rentals.createdAt, weekStart)),
    ])

    return {
      revenueTodaySen: Number(revenueResult[0]?.total ?? 0),
      activeRentalsCount: Number(activeResult[0]?.count ?? 0),
      bookingsThisWeek: Number(bookingsResult[0]?.count ?? 0),
    }
  },
)
