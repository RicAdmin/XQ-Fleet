import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { carPhotos, cars, customers, payments, rentals, users } from '#/db/schema'
import type { PaymentStatus, RentalStatus, RentalType } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles } from '#/lib/auth-model'
import {
  assertCarHasBookingCapacity,
  getCarFleetCapacity,
  usesSingleUnitCarStatus,
} from '#/lib/fleet-capacity'
import {
  adminInputValidator,
  carCategoryFilterSchema,
  paginationSchema,
  sortDirSchema,
} from '#/lib/validation/admin-schemas'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RentalListRow = {
  id: string
  carId: string
  customerId: string
  type: RentalType
  status: RentalStatus
  paymentStatus: PaymentStatus
  startDate: Date
  endDate: Date
  pickUpTime: string | null
  returnTime: string | null
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  paidAmountSen: number
  extraHoursDecimal: string | null
  createdAt: Date
  updatedAt: Date
  customerFullName: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerIcOrPassport: string | null
  pickUpLocation: string | null
  returnLocation: string | null
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  createdByUserId: string | null
  createdByName: string | null
}

export type RentalFullRow = RentalListRow & {
  actualReturnDate: Date | null
  startMileage: number | null
  endMileage: number | null
  startConditionNote: string | null
  endConditionNote: string | null
  carCategory: string | null
  carDailyRateSen: number | null
  carCoverPhotoUrl: string | null
  carCoverPhotoAlt: string | null
}

export type AvailableCarOption = {
  id: string
  plateNumber: string
  make: string
  model: string
  category: string
  dailyRateSen: number
}

// ─── Input types ──────────────────────────────────────────────────────────────

type CreateRentalInput = {
  carId: string
  customerId: string
  type: RentalType
  startDate: string // ISO date string YYYY-MM-DD
  endDate: string
  pickUpTime?: string
  returnTime?: string
  pickUpLocation?: string
  returnLocation?: string
  deliveryFeeSen?: number
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
}

type ConfirmHandoverInput = {
  rentalId: string
  startMileage: number
  startConditionNote?: string
}

type CloseReturnInput = {
  rentalId: string
  endMileage: number
  endConditionNote?: string
  paidAmountSen: number
  paymentMethod: string
  flagDamage?: boolean
}

type CancelRentalInput = {
  rentalId: string
}

type ExtendRentalInput = {
  rentalId: string
  newEndDate: string // ISO date string
}

type UpdateRentalBookingInput = {
  rentalId: string
  type: RentalType
  startDate: string
  endDate: string
  pickUpTime: string
  returnTime: string
  pickUpLocation: string
  returnLocation: string
}

type DeleteRentalInput = {
  rentalId: string
}

type GetRentalByIdInput = {
  rentalId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function derivePaymentStatus(paidSen: number, totalSen: number): PaymentStatus {
  if (paidSen <= 0) return 'unpaid'
  if (paidSen >= totalSen) return 'paid'
  return 'partial'
}

function calcTotalSen(dailyRateSen: number, startDate: Date, endDate: Date): number {
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  )
  return dailyRateSen * days
}

// ─── Server functions ─────────────────────────────────────────────────────────

export const getRentals = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(fleetOpsRoles)
  const { db } = await import('#/db')
  return db
    .select({
      id: rentals.id,
      carId: rentals.carId,
      customerId: rentals.customerId,
      type: rentals.type,
      status: rentals.status,
      paymentStatus: rentals.paymentStatus,
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      dailyRateSen: rentals.dailyRateSen,
      totalAmountSen: rentals.totalAmountSen,
      depositAmountSen: rentals.depositAmountSen,
      paidAmountSen: rentals.paidAmountSen,
      createdAt: rentals.createdAt,
      updatedAt: rentals.updatedAt,
      customerFullName: customers.fullName,
      carPlateNumber: cars.plateNumber,
      carMake: cars.make,
      carModel: cars.model,
    })
    .from(rentals)
    .leftJoin(cars, eq(rentals.carId, cars.id))
    .leftJoin(customers, eq(rentals.customerId, customers.id))
    .orderBy(desc(rentals.startDate))
})

const rentalStatusValues = [
  'pending',
  'active',
  'closed',
  'cancelled',
] as const satisfies readonly RentalStatus[]

export type RentalListResult = {
  rows: RentalListRow[]
  total: number
  page: number
  pageSize: number
  statusCounts?: Record<string, number>
}

export type OperationsQueue = {
  pickups: RentalListRow[]
  returns: RentalListRow[]
  all: RentalListRow[]
}

const rentalListSelect = {
  id: rentals.id,
  carId: rentals.carId,
  customerId: rentals.customerId,
  type: rentals.type,
  status: rentals.status,
  paymentStatus: rentals.paymentStatus,
  startDate: rentals.startDate,
  endDate: rentals.endDate,
  pickUpTime: rentals.pickUpTime,
  returnTime: rentals.returnTime,
  dailyRateSen: rentals.dailyRateSen,
  totalAmountSen: rentals.totalAmountSen,
  depositAmountSen: rentals.depositAmountSen,
  paidAmountSen: rentals.paidAmountSen,
  extraHoursDecimal: rentals.extraHoursDecimal,
  createdAt: rentals.createdAt,
  updatedAt: rentals.updatedAt,
  customerFullName: customers.fullName,
  customerEmail: customers.email,
  customerPhone: customers.phone,
  customerIcOrPassport: customers.icOrPassport,
  pickUpLocation: rentals.pickUpLocation,
  returnLocation: rentals.returnLocation,
  carPlateNumber: cars.plateNumber,
  carMake: cars.make,
  carModel: cars.model,
  createdByUserId: rentals.createdByUserId,
  createdByName: users.name,
} as const

export const getOperationsQueue = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OperationsQueue> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const rows = await db
      .select(rentalListSelect)
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))
      .where(inArray(rentals.status, ['pending', 'active']))
      .orderBy(asc(rentals.startDate), asc(rentals.endDate))

    const pickups = rows
      .filter((row) => row.status === 'pending')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    const returns = rows
      .filter((row) => row.status === 'active')
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())

    return { pickups, returns, all: rows }
  },
)

const listRentalsSchema = paginationSchema.extend({
  status: z.enum(rentalStatusValues).optional(),
  category: carCategoryFilterSchema,
  search: z.string().trim().max(120).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  includeStatusCounts: z.boolean().optional(),
  sortKey: z
    .enum([
      'startDate',
      'endDate',
      'totalAmountSen',
      'status',
      'carPlateNumber',
      'customerFullName',
      'createdAt',
    ])
    .default('startDate'),
  sortDir: sortDirSchema,
})

async function queryRentalStatusCounts() {
  const { db } = await import('#/db')
  const rows = await db
    .select({ status: rentals.status, count: sql<number>`count(*)::int` })
    .from(rentals)
    .groupBy(rentals.status)

  const statusCounts: Record<string, number> = { all: 0 }
  for (const row of rows) {
    const n = Number(row.count)
    statusCounts[row.status] = n
    statusCounts.all += n
  }
  return statusCounts
}

export const getRentalStatusCounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole(fleetOpsRoles)
    return queryRentalStatusCounts()
  },
)

export const listRentals = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listRentalsSchema))
  .handler(async ({ data }): Promise<RentalListResult> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const filters = []
    if (data.status) filters.push(eq(rentals.status, data.status))
    if (data.category) filters.push(eq(cars.category, data.category))
    if (data.from) {
      filters.push(gte(rentals.startDate, new Date(`${data.from}T00:00:00`)))
    }
    if (data.to) {
      filters.push(lte(rentals.startDate, new Date(`${data.to}T23:59:59.999`)))
    }
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(
        or(
          ilike(customers.fullName, needle),
          ilike(customers.phone, needle),
          ilike(customers.email, needle),
          ilike(cars.plateNumber, needle),
        )!,
      )
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const sortColumn = {
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      totalAmountSen: rentals.totalAmountSen,
      status: rentals.status,
      carPlateNumber: cars.plateNumber,
      customerFullName: customers.fullName,
      createdAt: rentals.createdAt,
    }[data.sortKey]

    const orderBy = data.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db
      .select(rentalListSelect)
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))

    const rowsPromise = whereClause
      ? baseQuery.where(whereClause).orderBy(orderBy).limit(data.pageSize).offset(offset)
      : baseQuery.orderBy(orderBy).limit(data.pageSize).offset(offset)

    const countBase = db
      .select({ count: sql<number>`count(*)::int` })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))

    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult, statusCounts] = await Promise.all([
      rowsPromise,
      countPromise,
      data.includeStatusCounts ? queryRentalStatusCounts() : Promise.resolve(undefined),
    ])

    return {
      rows,
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
      ...(statusCounts ? { statusCounts } : {}),
    }
  })

export const getRentalsByCarId = createServerFn({ method: 'GET' })
  .inputValidator((data: { carId: string }) => data)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    return db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        customerId: rentals.customerId,
        type: rentals.type,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        customerFullName: customers.fullName,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(eq(rentals.carId, data.carId))
      .orderBy(desc(rentals.startDate))
  })

/** Lightweight open jobs for status badges — avoids loading full rental history. */
export const getOpenRentalsByCarId = createServerFn({ method: 'GET' })
  .inputValidator((data: { carId: string }) => data)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    return db
      .select({
        id: rentals.id,
        status: rentals.status,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
      })
      .from(rentals)
      .where(
        and(
          eq(rentals.carId, data.carId),
          inArray(rentals.status, ['pending', 'active']),
        ),
      )
      .orderBy(desc(rentals.startDate))
      .limit(5)
  })

export const getRentalById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetRentalByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const rows = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        customerId: rentals.customerId,
        type: rentals.type,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        pickUpTime: rentals.pickUpTime,
        returnTime: rentals.returnTime,
        pickUpLocation: rentals.pickUpLocation,
        returnLocation: rentals.returnLocation,
        actualReturnDate: rentals.actualReturnDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        extraHoursDecimal: rentals.extraHoursDecimal,
        startMileage: rentals.startMileage,
        endMileage: rentals.endMileage,
        startConditionNote: rentals.startConditionNote,
        endConditionNote: rentals.endConditionNote,
        createdByUserId: rentals.createdByUserId,
        createdByName: users.name,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        customerFullName: customers.fullName,
        customerEmail: customers.email,
        customerIcOrPassport: customers.icOrPassport,
        customerPhone: customers.phone,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        carCategory: cars.category,
        carDailyRateSen: cars.dailyRateSen,
        carCoverPhotoUrl: carPhotos.url,
        carCoverPhotoAlt: carPhotos.altText,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(
        carPhotos,
        and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
      )
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    return rows[0] ?? null
  })

export const getAvailableCars = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(fleetOpsRoles)
  const { db } = await import('#/db')
  return db
    .select({
      id: cars.id,
      plateNumber: cars.plateNumber,
      make: cars.make,
      model: cars.model,
      category: cars.category,
      dailyRateSen: cars.dailyRateSen,
    })
    .from(cars)
    .where(eq(cars.status, 'available'))
    .orderBy(cars.plateNumber)
})

export const createRental = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      throw new Error('Invalid dates provided.')
    if (endDate <= startDate) throw new Error('End date must be after start date.')

    const pickUpLocation = data.pickUpLocation?.trim()
    const returnLocation = data.returnLocation?.trim()
    if (!pickUpLocation) throw new Error('Pickup location is required.')
    if (!returnLocation) throw new Error('Return location is required.')

    const { db } = await import('#/db')

    const fleetCapacity = await assertCarHasBookingCapacity(db, {
      carId: data.carId,
      tripStart: startDate,
      tripEnd: endDate,
      errorMessage: 'This car already has a booking that overlaps with the selected dates.',
    })

    // Get user ID for audit trail
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    const createdByUserId = session?.user?.id ?? null

    // Single-slot models keep legacy reserved status on the car row.
    if (usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'reserved', updatedAt: new Date() })
        .where(eq(cars.id, data.carId))
    }

    const result = await db
      .insert(rentals)
      .values({
        carId: data.carId,
        customerId: data.customerId,
        type: data.type,
        status: 'pending',
        paymentStatus: 'unpaid',
        startDate,
        endDate,
        pickUpTime: data.pickUpTime?.trim() || '09:00:00',
        returnTime: data.returnTime?.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        deliveryFeeSen: data.deliveryFeeSen ?? 0,
        dailyRateSen: data.dailyRateSen,
        totalAmountSen: data.totalAmountSen,
        depositAmountSen: data.depositAmountSen,
        paidAmountSen: 0,
        createdByUserId,
      })
      .returning()

    return result[0]
  })

export const confirmHandover = createServerFn({ method: 'POST' })
  .inputValidator((input: ConfirmHandoverInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({ id: rentals.id, carId: rentals.carId, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'pending')
      throw new Error('Only pending rentals can be confirmed for handover.')

    const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'rented', updatedAt: new Date() })
        .where(eq(cars.id, rental.carId))
    }

    const result = await db
      .update(rentals)
      .set({
        status: 'active',
        startMileage: data.startMileage,
        startConditionNote: data.startConditionNote ?? null,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    return result[0]
  })

export const closeReturn = createServerFn({ method: 'POST' })
  .inputValidator((input: CloseReturnInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        totalAmountSen: rentals.totalAmountSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'active') throw new Error('Only active rentals can be closed.')

    const paymentStatus = derivePaymentStatus(data.paidAmountSen, rental.totalAmountSen)
    const now = new Date()

    // Only single-slot models use cars.status as the live inventory signal.
    // Multi-unit catalog rows stay available while concurrent jobs are open.
    const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      const newCarStatus = data.flagDamage ? 'damaged' : 'available'
      await db
        .update(cars)
        .set({ status: newCarStatus, updatedAt: now })
        .where(eq(cars.id, rental.carId))
    }

    const endNote =
      data.flagDamage && data.endConditionNote
        ? `[DAMAGE] ${data.endConditionNote}`
        : data.flagDamage
          ? '[DAMAGE] Flagged on return'
          : (data.endConditionNote ?? null)

    const result = await db
      .update(rentals)
      .set({
        status: 'closed',
        paymentStatus,
        endMileage: data.endMileage,
        endConditionNote: endNote,
        paidAmountSen: data.paidAmountSen,
        actualReturnDate: now,
        updatedAt: now,
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    // Record the payment if amount > 0
    if (data.paidAmountSen > 0) {
      await db.insert(payments).values({
        rentalId: data.rentalId,
        provider: 'manual',
        amountSen: data.paidAmountSen,
        status: 'successful',
        paymentMethod: data.paymentMethod,
        respondedAt: now,
      })
    }

    // Phase 3.6: rental closed → flip pending attribution to earned.
    try {
      const { flipAttributionForRentalStatus } = await import(
        '#/lib/affiliate-functions'
      )
      await flipAttributionForRentalStatus(db, data.rentalId, 'closed')
    } catch {
      // never fail the close because of attribution
    }

    return result[0]
  })

export const cancelRental = createServerFn({ method: 'POST' })
  .inputValidator((input: CancelRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({ id: rentals.id, carId: rentals.carId, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'pending') throw new Error('Only pending rentals can be cancelled.')

    const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(cars.id, rental.carId))
    }

    const result = await db
      .update(rentals)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    // Phase 3.6: rental cancelled → flip pending attribution to voided.
    try {
      const { flipAttributionForRentalStatus } = await import(
        '#/lib/affiliate-functions'
      )
      await flipAttributionForRentalStatus(db, data.rentalId, 'cancelled')
    } catch {
      // never fail the cancel because of attribution
    }

    return result[0]
  })

export const extendRental = createServerFn({ method: 'POST' })
  .inputValidator((input: ExtendRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        startDate: rentals.startDate,
        dailyRateSen: rentals.dailyRateSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'active') throw new Error('Only active rentals can be extended.')

    const newEndDate = new Date(data.newEndDate)
    if (isNaN(newEndDate.getTime())) throw new Error('Invalid date.')
    if (newEndDate <= rental.startDate)
      throw new Error('New end date must be after the rental start date.')

    await assertCarHasBookingCapacity(db, {
      carId: rental.carId,
      tripStart: rental.startDate,
      tripEnd: newEndDate,
      excludeRentalId: data.rentalId,
      errorMessage: 'Cannot extend — another booking overlaps with the new end date.',
    })

    const newTotalSen = calcTotalSen(rental.dailyRateSen, rental.startDate, newEndDate)

    const result = await db
      .update(rentals)
      .set({ endDate: newEndDate, totalAmountSen: newTotalSen, updatedAt: new Date() })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    return result[0]
  })

export const updateRentalBooking = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateRentalBookingInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        dailyRateSen: rentals.dailyRateSen,
        paidAmountSen: rentals.paidAmountSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Job not found.')
    if (rental.status !== 'pending' && rental.status !== 'active') {
      throw new Error('Only pending or active jobs can be edited.')
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid dates provided.')
    }
    if (endDate <= startDate) throw new Error('Return date must be after pickup date.')

    const pickUpLocation = data.pickUpLocation.trim()
    const returnLocation = data.returnLocation.trim()
    if (!pickUpLocation) throw new Error('Pickup location is required.')
    if (!returnLocation) throw new Error('Return location is required.')

    await assertCarHasBookingCapacity(db, {
      carId: rental.carId,
      tripStart: startDate,
      tripEnd: endDate,
      excludeRentalId: data.rentalId,
      errorMessage: 'These dates overlap another booking for this car.',
    })

    const totalAmountSen = calcTotalSen(rental.dailyRateSen, startDate, endDate)
    const paymentStatus = derivePaymentStatus(rental.paidAmountSen, totalAmountSen)

    const result = await db
      .update(rentals)
      .set({
        type: data.type,
        startDate,
        endDate,
        pickUpTime: data.pickUpTime.trim() || '09:00:00',
        returnTime: data.returnTime.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        totalAmountSen,
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    return result[0]
  })

export const deleteRental = createServerFn({ method: 'POST' })
  .inputValidator((input: DeleteRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({ id: rentals.id, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status === 'active')
      throw new Error('Active rentals cannot be deleted. Close or cancel first.')

    const result = await db
      .delete(rentals)
      .where(eq(rentals.id, data.rentalId))
      .returning({ id: rentals.id })

    if (!result[0]) throw new Error('Rental not found.')
    return { rentalId: data.rentalId }
  })
