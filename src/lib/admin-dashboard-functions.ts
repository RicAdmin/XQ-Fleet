import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gte, ilike, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
  cars,
  customers,
  payments,
  promos,
  refunds,
  rentals,
} from '#/db/schema'
import type {
  CarCategory,
  CarStatus,
  PaymentStatus,
  RentalStatus,
} from '#/db/schema'
import { requireAdmin } from '#/lib/auth-functions'
import {
  adminInputValidator,
  dateOnlyString,
  paginationSchema,
  sortDirSchema,
  trimmedString,
} from '#/lib/validation/admin-schemas'

// ─── KPI types & helpers ──────────────────────────────────────────────────────

export type AdminDashboardKpis = {
  bookingsToday: number
  mtdRevenueSen: number
  mtdRevenueLastMonthSen: number
  mtdRevenueMomDeltaPct: number | null
  activeRentals: number
  overdueRentals: number
  pendingRefunds: number
}

/** Local-day start (midnight) for a date. */
function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** First-of-month at local midnight. */
function startOfLocalMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Compute a same-day cutoff in the previous month for MoM apples-to-apples comparison. */
function lastMonthSameDayCutoff(d: Date): Date {
  const target = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate())
  // If we overflow because last month has fewer days, clamp to end of last month
  if (target.getMonth() === d.getMonth()) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  return target
}

export function computeMomDelta(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return current > 0 ? null : 0
  return ((current - previous) / previous) * 100
}

// ─── 1.3 — getAdminDashboardKpis ──────────────────────────────────────────────

export const getAdminDashboardKpis = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AdminDashboardKpis> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const now = new Date()
    const todayStart = startOfLocalDay(now)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    const monthStart = startOfLocalMonth(now)
    const lastMonthStart = startOfLocalMonth(
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
    )
    const lastMonthCutoff = lastMonthSameDayCutoff(now)

    const [bookingsTodayRow, mtdRow, lastMonthRow, activeRow, overdueRow, refundsRow] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(rentals)
          .where(
            and(gte(rentals.createdAt, todayStart), lt(rentals.createdAt, tomorrowStart)),
          ),
        db
          .select({ total: sql<number>`coalesce(sum(paid_amount_sen), 0)::int` })
          .from(rentals)
          .where(
            and(
              eq(rentals.status, 'closed'),
              gte(rentals.actualReturnDate, monthStart),
              lt(rentals.actualReturnDate, tomorrowStart),
            ),
          ),
        db
          .select({ total: sql<number>`coalesce(sum(paid_amount_sen), 0)::int` })
          .from(rentals)
          .where(
            and(
              eq(rentals.status, 'closed'),
              gte(rentals.actualReturnDate, lastMonthStart),
              lt(rentals.actualReturnDate, lastMonthCutoff),
            ),
          ),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(rentals)
          .where(eq(rentals.status, 'active')),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(rentals)
          .where(and(eq(rentals.status, 'active'), lt(rentals.endDate, todayStart))),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(refunds)
          .where(eq(refunds.status, 'requested')),
      ])

    const mtdRevenueSen = Number(mtdRow[0]?.total ?? 0)
    const mtdRevenueLastMonthSen = Number(lastMonthRow[0]?.total ?? 0)

    return {
      bookingsToday: Number(bookingsTodayRow[0]?.count ?? 0),
      mtdRevenueSen,
      mtdRevenueLastMonthSen,
      mtdRevenueMomDeltaPct: computeMomDelta(mtdRevenueSen, mtdRevenueLastMonthSen),
      activeRentals: Number(activeRow[0]?.count ?? 0),
      overdueRentals: Number(overdueRow[0]?.count ?? 0),
      pendingRefunds: Number(refundsRow[0]?.count ?? 0),
    }
  },
)

// ─── 1.5 — getAdminBookings ───────────────────────────────────────────────────

export type AdminBookingRow = {
  id: string
  status: RentalStatus
  paymentStatus: PaymentStatus
  startDate: Date
  endDate: Date
  totalAmountSen: number
  paidAmountSen: number
  couponCode: string | null
  createdAt: Date
  customerId: string
  customerFullName: string | null
  customerEmail: string | null
  carId: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
}

export type AdminBookingsResult = {
  rows: AdminBookingRow[]
  total: number
  page: number
  pageSize: number
}

const rentalStatusValues = [
  'pending',
  'active',
  'closed',
  'cancelled',
] as const

const adminBookingsInputSchema = paginationSchema.extend({
  status: z.enum(rentalStatusValues).optional(),
  from: dateOnlyString.optional(),
  to: dateOnlyString.optional(),
  search: z.string().trim().max(120).optional(),
  sortKey: z
    .enum(['createdAt', 'startDate', 'endDate', 'totalAmountSen', 'status'])
    .default('createdAt'),
  sortDir: sortDirSchema,
})

export type AdminBookingsInput = z.infer<typeof adminBookingsInputSchema>

export const getAdminBookings = createServerFn({ method: 'GET' })
  .inputValidator(adminBookingsInputSchema.parse.bind(adminBookingsInputSchema))
  .handler(async ({ data }): Promise<AdminBookingsResult> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const filters = [] as Array<ReturnType<typeof eq>>
    if (data.status) filters.push(eq(rentals.status, data.status))
    if (data.from) {
      filters.push(gte(rentals.startDate, new Date(`${data.from}T00:00:00.000Z`)))
    }
    if (data.to) {
      const toEnd = new Date(`${data.to}T00:00:00.000Z`)
      toEnd.setUTCDate(toEnd.getUTCDate() + 1)
      filters.push(lt(rentals.startDate, toEnd))
    }

    let searchClause: ReturnType<typeof or> | null = null
    if (data.search && data.search.length > 0) {
      const needle = `%${data.search}%`
      searchClause = or(
        ilike(customers.fullName, needle),
        ilike(customers.email, needle),
        ilike(cars.plateNumber, needle),
        ilike(rentals.couponCode, needle),
      )!
    }

    const whereClause =
      filters.length || searchClause
        ? and(...filters, ...(searchClause ? [searchClause] : []))
        : undefined

    const sortColumn = {
      createdAt: rentals.createdAt,
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      totalAmountSen: rentals.totalAmountSen,
      status: rentals.status,
    }[data.sortKey]

    const orderBy = data.sortDir === 'asc' ? sortColumn : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db
      .select({
        id: rentals.id,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        couponCode: rentals.couponCode,
        createdAt: rentals.createdAt,
        customerId: customers.id,
        customerFullName: customers.fullName,
        customerEmail: customers.email,
        carId: cars.id,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
      })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(cars, eq(rentals.carId, cars.id))

    const rowsPromise = whereClause
      ? baseQuery.where(whereClause).orderBy(orderBy).limit(data.pageSize).offset(offset)
      : baseQuery.orderBy(orderBy).limit(data.pageSize).offset(offset)

    const countBase = db
      .select({ count: sql<number>`count(*)::int` })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(cars, eq(rentals.carId, cars.id))

    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise])

    return {
      rows: rows as AdminBookingRow[],
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
    }
  })

// Export-all helper: same filters, no pagination, capped to a safe upper bound.
export const exportAdminBookings = createServerFn({ method: 'GET' })
  .inputValidator(
    adminBookingsInputSchema
      .omit({ page: true, pageSize: true })
      .parse.bind(adminBookingsInputSchema.omit({ page: true, pageSize: true })),
  )
  .handler(async ({ data }): Promise<AdminBookingRow[]> => {
    await requireAdmin()
    const all = await getAdminBookings({
      data: { ...data, page: 1, pageSize: 5000 },
    })
    return all.rows
  })

// ─── 1.9 — getAdminPayments ───────────────────────────────────────────────────

export type AdminPaymentRow = {
  id: string
  rentalId: string
  provider: string
  externalRef: string | null
  amountSen: number
  currency: string
  status: string
  paymentMethod: string | null
  respondedAt: Date | null
  createdAt: Date
  rentalCarPlateNumber: string | null
  rentalCustomerFullName: string | null
}

export type AdminPaymentsResult = {
  rows: AdminPaymentRow[]
  total: number
  page: number
  pageSize: number
}

const adminPaymentsInputSchema = paginationSchema.extend({
  status: z
    .enum(['pending', 'successful', 'failed', 'voided'])
    .optional(),
  from: dateOnlyString.optional(),
  to: dateOnlyString.optional(),
  search: z.string().trim().max(120).optional(),
})

export type AdminPaymentsInput = z.infer<typeof adminPaymentsInputSchema>

export const getAdminPayments = createServerFn({ method: 'GET' })
  .inputValidator(adminPaymentsInputSchema.parse.bind(adminPaymentsInputSchema))
  .handler(async ({ data }): Promise<AdminPaymentsResult> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const filters = []
    if (data.status) filters.push(eq(payments.status, data.status))
    if (data.from) {
      filters.push(gte(payments.createdAt, new Date(`${data.from}T00:00:00.000Z`)))
    }
    if (data.to) {
      const toEnd = new Date(`${data.to}T00:00:00.000Z`)
      toEnd.setUTCDate(toEnd.getUTCDate() + 1)
      filters.push(lt(payments.createdAt, toEnd))
    }

    let search: ReturnType<typeof or> | null = null
    if (data.search) {
      const needle = `%${data.search}%`
      search = or(
        ilike(payments.externalRef, needle),
        ilike(cars.plateNumber, needle),
        ilike(customers.fullName, needle),
      )!
    }

    const whereClause =
      filters.length || search
        ? and(...filters, ...(search ? [search] : []))
        : undefined

    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db
      .select({
        id: payments.id,
        rentalId: payments.rentalId,
        provider: payments.provider,
        externalRef: payments.externalRef,
        amountSen: payments.amountSen,
        currency: payments.currency,
        status: payments.status,
        paymentMethod: payments.paymentMethod,
        respondedAt: payments.respondedAt,
        createdAt: payments.createdAt,
        rentalCarPlateNumber: cars.plateNumber,
        rentalCustomerFullName: customers.fullName,
      })
      .from(payments)
      .leftJoin(rentals, eq(payments.rentalId, rentals.id))
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))

    const rowsPromise = whereClause
      ? baseQuery
          .where(whereClause)
          .orderBy(desc(payments.createdAt))
          .limit(data.pageSize)
          .offset(offset)
      : baseQuery
          .orderBy(desc(payments.createdAt))
          .limit(data.pageSize)
          .offset(offset)

    const countBase = db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .leftJoin(rentals, eq(payments.rentalId, rentals.id))
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))

    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise])

    return {
      rows: rows as AdminPaymentRow[],
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
    }
  })

// ─── 1.10 — getAdminCarsForAdmin ──────────────────────────────────────────────

export type AdminCarRow = {
  id: string
  plateNumber: string
  make: string
  model: string
  year: number
  category: CarCategory
  status: CarStatus
  dailyRateSen: number
  lifetimeRevenueSen: number
  lifetimeRentals: number
}

export type AdminCarsResult = {
  rows: AdminCarRow[]
  total: number
  page: number
  pageSize: number
}

const adminCarsInputSchema = paginationSchema.extend({
  status: z
    .enum([
      'available',
      'reserved',
      'payment-pending',
      'rented',
      'maintenance',
      'damaged',
      'retired',
    ])
    .optional(),
  search: z.string().trim().max(120).optional(),
})

export type AdminCarsInput = z.infer<typeof adminCarsInputSchema>

export const getAdminCarsForAdmin = createServerFn({ method: 'GET' })
  .inputValidator(adminCarsInputSchema.parse.bind(adminCarsInputSchema))
  .handler(async ({ data }): Promise<AdminCarsResult> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const filters = []
    if (data.status) filters.push(eq(cars.status, data.status))
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(
        or(
          ilike(cars.plateNumber, needle),
          ilike(cars.make, needle),
          ilike(cars.model, needle),
        )!,
      )
    }

    const whereClause = filters.length ? and(...filters) : undefined
    const offset = (data.page - 1) * data.pageSize

    const baseRows = db
      .select({
        id: cars.id,
        plateNumber: cars.plateNumber,
        make: cars.make,
        model: cars.model,
        year: cars.year,
        category: cars.category,
        status: cars.status,
        dailyRateSen: cars.dailyRateSen,
        lifetimeRevenueSen: sql<number>`coalesce(sum(case when ${rentals.status} = 'closed' then ${rentals.paidAmountSen} else 0 end), 0)::int`,
        lifetimeRentals: sql<number>`coalesce(count(${rentals.id}) filter (where ${rentals.status} = 'closed'), 0)::int`,
      })
      .from(cars)
      .leftJoin(rentals, eq(rentals.carId, cars.id))
      .groupBy(cars.id)

    const rowsPromise = whereClause
      ? baseRows.where(whereClause).orderBy(cars.plateNumber).limit(data.pageSize).offset(offset)
      : baseRows.orderBy(cars.plateNumber).limit(data.pageSize).offset(offset)

    const countBase = db.select({ count: sql<number>`count(*)::int` }).from(cars)
    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise])

    return {
      rows: rows as AdminCarRow[],
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
    }
  })

// ─── Booking detail (drawer payload) ─────────────────────────────────────────

export type AdminBookingDetail = AdminBookingRow & {
  pickUpTime: string | null
  returnTime: string | null
  pickUpLocation: string | null
  returnLocation: string | null
  baseRentalSen: number
  extraChargeSen: number
  addonsTotalSen: number
  deliveryFeeSen: number
  discountAmountSen: number
  subTotalSen: number
  customerPhone: string | null
  customerIcOrPassport: string | null
  promoTitle: string | null
}

export type AdminRentalNote = {
  id: string
  body: string
  createdAt: Date
  authorName: string | null
}

export type AdminRefundRow = {
  id: string
  status: 'requested' | 'approved' | 'rejected' | 'paid'
  amountSen: number
  reason: string | null
  requestedAt: Date
  processedAt: Date | null
}

export type AdminBookingDrawerPayload = {
  booking: AdminBookingDetail
  notes: AdminRentalNote[]
  refunds: AdminRefundRow[]
}

const getAdminBookingDetailSchema = z.object({ rentalId: trimmedString(64) })

export const getAdminBookingDetail = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(getAdminBookingDetailSchema))
  .handler(async ({ data }): Promise<AdminBookingDrawerPayload | null> => {
    await requireAdmin()
    const { db } = await import('#/db')
    const { rentalNotes } = await import('#/db/schema')
    const { users } = await import('#/db/schema')

    const [row] = await db
      .select({
        id: rentals.id,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        couponCode: rentals.couponCode,
        createdAt: rentals.createdAt,
        pickUpTime: rentals.pickUpTime,
        returnTime: rentals.returnTime,
        pickUpLocation: rentals.pickUpLocation,
        returnLocation: rentals.returnLocation,
        baseRentalSen: rentals.baseRentalSen,
        extraChargeSen: rentals.extraChargeSen,
        addonsTotalSen: rentals.addonsTotalSen,
        deliveryFeeSen: rentals.deliveryFeeSen,
        discountAmountSen: rentals.discountAmountSen,
        subTotalSen: rentals.subTotalSen,
        customerId: customers.id,
        customerFullName: customers.fullName,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        customerIcOrPassport: customers.icOrPassport,
        carId: cars.id,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        promoTitle: promos.title,
      })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(promos, eq(promos.title, rentals.couponCode))
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    if (!row) return null

    const [noteRows, refundRows] = await Promise.all([
      db
        .select({
          id: rentalNotes.id,
          body: rentalNotes.body,
          createdAt: rentalNotes.createdAt,
          authorName: users.name,
        })
        .from(rentalNotes)
        .leftJoin(users, eq(rentalNotes.authorUserId, users.id))
        .where(eq(rentalNotes.rentalId, data.rentalId))
        .orderBy(desc(rentalNotes.createdAt)),
      db
        .select({
          id: refunds.id,
          status: refunds.status,
          amountSen: refunds.amountSen,
          reason: refunds.reason,
          requestedAt: refunds.requestedAt,
          processedAt: refunds.processedAt,
        })
        .from(refunds)
        .where(eq(refunds.rentalId, data.rentalId))
        .orderBy(desc(refunds.requestedAt)),
    ])

    return {
      booking: row as AdminBookingDetail,
      notes: noteRows as AdminRentalNote[],
      refunds: refundRows as AdminRefundRow[],
    }
  })
