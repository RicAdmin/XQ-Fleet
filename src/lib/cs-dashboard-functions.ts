import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm'

import { cars, customers, rentals } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles } from '#/lib/auth-model'

export type CsDashboardKpis = {
  pendingPaymentCount: number
  pendingPaymentOutstandingSen: number
  holdsExpiringWithin24h: number
  holdsExpired: number
  pickupsToday: number
  returnsToday: number
  overdueReturns: number
}

export type CsPaymentChaseRow = {
  rentalId: string
  customerName: string | null
  customerPhone: string | null
  customerEmail: string | null
  carLabel: string
  plateNumber: string | null
  startDate: string
  createdAt: string
  paymentHoldExpiresAt: string | null
  paymentStatus: string
  outstandingSen: number
}

export type CsScheduleRow = {
  rentalId: string
  customerName: string | null
  customerPhone: string | null
  carLabel: string
  plateNumber: string | null
  time: string | null
  location: string | null
  overdue: boolean
}

export type CsToConfirmRow = {
  rentalId: string
  customerName: string | null
  customerPhone: string | null
  carLabel: string
  plateNumber: string | null
  startDate: string
  createdAt: string
  bookingExpiresAt: string | null
  remainingMs: number | null
  totalAmountSen: number
  outstandingSen: number
  own: boolean
}

export type CsDashboardPayload = {
  generatedAt: string
  kpis: CsDashboardKpis
  toConfirm: CsToConfirmRow[]
  paymentChase: CsPaymentChaseRow[]
  pickupsToday: CsScheduleRow[]
  returnsToday: CsScheduleRow[]
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const baseSelect = {
  rentalId: rentals.id,
  customerName: customers.fullName,
  customerPhone: customers.phone,
  customerEmail: customers.email,
  make: cars.make,
  model: cars.model,
  listingPlate: cars.plateNumber,
  startDate: rentals.startDate,
  endDate: rentals.endDate,
  createdAt: rentals.createdAt,
  paymentHoldExpiresAt: rentals.paymentHoldExpiresAt,
  bookingExpiresAt: rentals.bookingExpiresAt,
  createdByUserId: rentals.createdByUserId,
  paymentStatus: rentals.paymentStatus,
  totalAmountSen: rentals.totalAmountSen,
  paidAmountSen: rentals.paidAmountSen,
  pickUpTime: rentals.pickUpTime,
  returnTime: rentals.returnTime,
  pickUpLocation: rentals.pickUpLocation,
  returnLocation: rentals.returnLocation,
}

export const getCsDashboard = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CsDashboardPayload> => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const { expireStaleBookings } = await import('#/lib/rental-functions')
    await expireStaleBookings(db)

    const now = new Date()
    const todayStart = startOfLocalDay(now)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const [toConfirmRows, chaseRows, pickupRows, returnRows] = await Promise.all([
      db
        .select(baseSelect)
        .from(rentals)
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .leftJoin(cars, eq(rentals.carId, cars.id))
        .where(eq(rentals.status, 'pending'))
        .orderBy(asc(rentals.bookingExpiresAt), asc(rentals.createdAt)),
      db
        .select(baseSelect)
        .from(rentals)
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .leftJoin(cars, eq(rentals.carId, cars.id))
        .where(
          and(
            eq(rentals.status, 'pending'),
            inArray(rentals.paymentStatus, ['unpaid', 'partial']),
          ),
        )
        .orderBy(asc(rentals.paymentHoldExpiresAt), asc(rentals.createdAt)),
      db
        .select(baseSelect)
        .from(rentals)
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .leftJoin(cars, eq(rentals.carId, cars.id))
        .where(
          and(
            eq(rentals.status, 'confirmed'),
            gte(rentals.startDate, todayStart),
            lt(rentals.startDate, tomorrowStart),
          ),
        )
        .orderBy(asc(rentals.pickUpTime)),
      db
        .select(baseSelect)
        .from(rentals)
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .leftJoin(cars, eq(rentals.carId, cars.id))
        .where(and(eq(rentals.status, 'active'), lt(rentals.endDate, tomorrowStart)))
        .orderBy(asc(rentals.endDate)),
    ])

    const sessionUserId = roleSession.user.id
    const toConfirm: CsToConfirmRow[] = toConfirmRows
      .map((row) => ({
        rentalId: row.rentalId,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        carLabel: `${row.make ?? ''} ${row.model ?? ''}`.trim() || 'Vehicle',
        plateNumber: row.listingPlate,
        startDate: row.startDate.toISOString(),
        createdAt: row.createdAt.toISOString(),
        bookingExpiresAt: row.bookingExpiresAt?.toISOString() ?? null,
        remainingMs: row.bookingExpiresAt
          ? row.bookingExpiresAt.getTime() - now.getTime()
          : null,
        totalAmountSen: row.totalAmountSen,
        outstandingSen: Math.max(0, row.totalAmountSen - row.paidAmountSen),
        own: row.createdByUserId === sessionUserId,
      }))
      .sort((a, b) => {
        if (a.own !== b.own) return a.own ? -1 : 1
        return (a.remainingMs ?? Infinity) - (b.remainingMs ?? Infinity)
      })

    const paymentChase: CsPaymentChaseRow[] = chaseRows.map((row) => ({      rentalId: row.rentalId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      customerEmail: row.customerEmail,
      carLabel: `${row.make ?? ''} ${row.model ?? ''}`.trim() || 'Vehicle',
      plateNumber: row.listingPlate,
      startDate: row.startDate.toISOString(),
      createdAt: row.createdAt.toISOString(),
      paymentHoldExpiresAt: row.paymentHoldExpiresAt?.toISOString() ?? null,
      paymentStatus: row.paymentStatus,
      outstandingSen: Math.max(0, row.totalAmountSen - row.paidAmountSen),
    }))

    const pickupsToday: CsScheduleRow[] = pickupRows.map((row) => ({
      rentalId: row.rentalId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      carLabel: `${row.make ?? ''} ${row.model ?? ''}`.trim() || 'Vehicle',
      plateNumber: row.listingPlate,
      time: row.pickUpTime,
      location: row.pickUpLocation,
      overdue: false,
    }))

    const returnsToday: CsScheduleRow[] = returnRows.map((row) => ({
      rentalId: row.rentalId,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      carLabel: `${row.make ?? ''} ${row.model ?? ''}`.trim() || 'Vehicle',
      plateNumber: row.listingPlate,
      time: row.returnTime,
      location: row.returnLocation,
      overdue: row.endDate < todayStart,
    }))

    const kpis: CsDashboardKpis = {
      pendingPaymentCount: paymentChase.length,
      pendingPaymentOutstandingSen: paymentChase.reduce(
        (sum, row) => sum + row.outstandingSen,
        0,
      ),
      holdsExpiringWithin24h: paymentChase.filter((row) => {
        if (!row.paymentHoldExpiresAt) return false
        const expiry = new Date(row.paymentHoldExpiresAt)
        return expiry > now && expiry <= in24h
      }).length,
      holdsExpired: paymentChase.filter((row) => {
        if (!row.paymentHoldExpiresAt) return false
        return new Date(row.paymentHoldExpiresAt) <= now
      }).length,
      pickupsToday: pickupsToday.length,
      returnsToday: returnsToday.filter((row) => !row.overdue).length,
      overdueReturns: returnsToday.filter((row) => row.overdue).length,
    }

    return {
      generatedAt: now.toISOString(),
      kpis,
      toConfirm,
      paymentChase,
      pickupsToday,
      returnsToday,
    }
  },
)
