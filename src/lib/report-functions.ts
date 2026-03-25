import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm'

import { cars, customers, rentals } from '#/db/schema'
import type { CarCategory, RentalStatus } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RevenueRow = {
  id: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  carCategory: CarCategory | null
  customerFullName: string | null
  actualReturnDate: Date
  totalAmountSen: number
  paidAmountSen: number
  depositAmountSen: number
}

export type OutstandingRow = {
  id: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  customerFullName: string | null
  endDate: Date
  totalAmountSen: number
  paidAmountSen: number
  status: RentalStatus
}

export type RevenueReport = {
  rows: RevenueRow[]
  outstanding: OutstandingRow[]
}

export type UtilizationRow = {
  carId: string
  plateNumber: string
  make: string
  model: string
  category: CarCategory
  rentalCount: number
  totalDaysRented: number
}

export type UtilizationReport = {
  rows: UtilizationRow[]
  periodDays: number
}

export type OverdueReportRow = {
  id: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  customerFullName: string | null
  endDate: Date
  daysOverdue: number
  totalAmountSen: number
  paidAmountSen: number
}

export type RentalHistoryRow = {
  id: string
  customerFullName: string | null
  status: RentalStatus
  startDate: Date
  endDate: Date
  actualReturnDate: Date | null
  totalAmountSen: number
  paidAmountSen: number
  depositAmountSen: number
}

export type RentalHistoryReport = {
  rows: RentalHistoryRow[]
  total: number
  page: number
  pageSize: number
}

export type CarSelectRow = {
  id: string
  plateNumber: string
  make: string
  model: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateRangeUTC(from: string, to: string): { fromDate: Date; toExclusive: Date } {
  const fromDate = new Date(`${from}T00:00:00.000Z`)
  const toExclusive = new Date(`${to}T00:00:00.000Z`)
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)
  return { fromDate, toExclusive }
}

const HISTORY_PAGE_SIZE = 25

// ─── Server functions ─────────────────────────────────────────────────────────

export const getRevenueReport = createServerFn({ method: 'GET' })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }): Promise<RevenueReport> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const { fromDate, toExclusive } = parseDateRangeUTC(data.from, data.to)

    const rows = await db
      .select({
        id: rentals.id,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        carCategory: cars.category,
        customerFullName: customers.fullName,
        actualReturnDate: rentals.actualReturnDate,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        depositAmountSen: rentals.depositAmountSen,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(
        and(
          eq(rentals.status, 'closed'),
          gte(rentals.actualReturnDate, fromDate),
          lt(rentals.actualReturnDate, toExclusive),
        ),
      )
      .orderBy(desc(rentals.actualReturnDate))

    const outstanding = await db
      .select({
        id: rentals.id,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        customerFullName: customers.fullName,
        endDate: rentals.endDate,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        status: rentals.status,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(
        and(
          inArray(rentals.status, ['pending', 'active']),
          sql`${rentals.paidAmountSen} < ${rentals.totalAmountSen}`,
        ),
      )
      .orderBy(rentals.endDate)

    return { rows: rows as RevenueRow[], outstanding: outstanding as OutstandingRow[] }
  })

export const getUtilizationReport = createServerFn({ method: 'GET' })
  .inputValidator((input: { from: string; to: string }) => input)
  .handler(async ({ data }): Promise<UtilizationReport> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const { fromDate, toExclusive } = parseDateRangeUTC(data.from, data.to)
    const periodDays = Math.round((toExclusive.getTime() - fromDate.getTime()) / 86400000)

    const rows = await db
      .select({
        carId: cars.id,
        plateNumber: cars.plateNumber,
        make: cars.make,
        model: cars.model,
        category: cars.category,
        rentalCount: sql<number>`count(${rentals.id})::int`,
        totalDaysRented: sql<number>`coalesce(sum(extract(day from (coalesce(${rentals.actualReturnDate}, ${rentals.endDate}) - ${rentals.startDate}))), 0)::int`,
      })
      .from(cars)
      .leftJoin(
        rentals,
        and(
          eq(rentals.carId, cars.id),
          inArray(rentals.status, ['active', 'closed']),
          gte(rentals.startDate, fromDate),
          lt(rentals.startDate, toExclusive),
        ),
      )
      .groupBy(cars.id, cars.plateNumber, cars.make, cars.model, cars.category)
      .orderBy(desc(sql`count(${rentals.id})`))

    return { rows, periodDays }
  })

export const getOverdueReport = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OverdueReportRow[]> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const rawRows = await db
      .select({
        id: rentals.id,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        customerFullName: customers.fullName,
        endDate: rentals.endDate,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(and(eq(rentals.status, 'active'), lt(rentals.endDate, todayStart)))
      .orderBy(rentals.endDate)

    return rawRows.map((r) => ({
      ...r,
      daysOverdue: Math.max(1, Math.floor((todayStart.getTime() - r.endDate.getTime()) / 86400000)),
    }))
  },
)

export const getRentalHistoryReport = createServerFn({ method: 'GET' })
  .inputValidator((input: { carId: string; page: number }) => input)
  .handler(async ({ data }): Promise<RentalHistoryReport> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const offset = (data.page - 1) * HISTORY_PAGE_SIZE

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: rentals.id,
          customerFullName: customers.fullName,
          status: rentals.status,
          startDate: rentals.startDate,
          endDate: rentals.endDate,
          actualReturnDate: rentals.actualReturnDate,
          totalAmountSen: rentals.totalAmountSen,
          paidAmountSen: rentals.paidAmountSen,
          depositAmountSen: rentals.depositAmountSen,
        })
        .from(rentals)
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .where(eq(rentals.carId, data.carId))
        .orderBy(desc(rentals.startDate))
        .limit(HISTORY_PAGE_SIZE)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(rentals)
        .where(eq(rentals.carId, data.carId)),
    ])

    return {
      rows,
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: HISTORY_PAGE_SIZE,
    }
  })

export const getCarsForSelect = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CarSelectRow[]> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    return db
      .select({
        id: cars.id,
        plateNumber: cars.plateNumber,
        make: cars.make,
        model: cars.model,
      })
      .from(cars)
      .orderBy(cars.plateNumber)
  },
)
