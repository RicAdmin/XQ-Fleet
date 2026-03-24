import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gt, inArray, lt, ne } from 'drizzle-orm'

import { cars, customers, payments, rentals } from '#/db/schema'
import type { PaymentStatus, RentalStatus, RentalType } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'

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
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  paidAmountSen: number
  createdAt: Date
  updatedAt: Date
  customerFullName: string | null
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
}

export type RentalFullRow = RentalListRow & {
  actualReturnDate: Date | null
  startMileage: number | null
  endMileage: number | null
  startConditionNote: string | null
  endConditionNote: string | null
  createdByUserId: string | null
  customerIcOrPassport: string | null
  customerPhone: string | null
  carCategory: string | null
  carDailyRateSen: number | null
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
  await requireRole(['owner', 'staff'])
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

export const getRentalById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetRentalByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner', 'staff'])
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
        actualReturnDate: rentals.actualReturnDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        startMileage: rentals.startMileage,
        endMileage: rentals.endMileage,
        startConditionNote: rentals.startConditionNote,
        endConditionNote: rentals.endConditionNote,
        createdByUserId: rentals.createdByUserId,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        customerFullName: customers.fullName,
        customerIcOrPassport: customers.icOrPassport,
        customerPhone: customers.phone,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        carCategory: cars.category,
        carDailyRateSen: cars.dailyRateSen,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    return rows[0] ?? null
  })

export const getAvailableCars = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(['owner', 'staff'])
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
    await requireRole(['owner', 'staff'])

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      throw new Error('Invalid dates provided.')
    if (endDate <= startDate) throw new Error('End date must be after start date.')

    const { db } = await import('#/db')

    // Overlap check
    const overlap = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.carId, data.carId),
          inArray(rentals.status, ['pending', 'active']),
          lt(rentals.startDate, endDate),
          gt(rentals.endDate, startDate),
        ),
      )
      .limit(1)

    if (overlap.length > 0)
      throw new Error('This car already has a booking that overlaps with the selected dates.')

    // Get user ID for audit trail
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    const createdByUserId = session?.user?.id ?? null

    // Set car to reserved
    await db.update(cars).set({ status: 'reserved', updatedAt: new Date() }).where(eq(cars.id, data.carId))

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
    await requireRole(['owner', 'staff'])
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

    await db.update(cars).set({ status: 'rented', updatedAt: new Date() }).where(eq(cars.id, rental.carId))

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
    await requireRole(['owner', 'staff'])
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
    const newCarStatus = data.flagDamage ? 'damaged' : 'available'
    const now = new Date()

    await db
      .update(cars)
      .set({ status: newCarStatus, updatedAt: now })
      .where(eq(cars.id, rental.carId))

    const result = await db
      .update(rentals)
      .set({
        status: 'closed',
        paymentStatus,
        endMileage: data.endMileage,
        endConditionNote: data.endConditionNote ?? null,
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

    return result[0]
  })

export const cancelRental = createServerFn({ method: 'POST' })
  .inputValidator((input: CancelRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner', 'staff'])
    const { db } = await import('#/db')

    const existing = await db
      .select({ id: rentals.id, carId: rentals.carId, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'pending') throw new Error('Only pending rentals can be cancelled.')

    await db
      .update(cars)
      .set({ status: 'available', updatedAt: new Date() })
      .where(eq(cars.id, rental.carId))

    const result = await db
      .update(rentals)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    return result[0]
  })

export const extendRental = createServerFn({ method: 'POST' })
  .inputValidator((input: ExtendRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner'])
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

    // Overlap check (exclude current rental)
    const overlap = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.carId, rental.carId),
          inArray(rentals.status, ['pending', 'active']),
          ne(rentals.id, data.rentalId),
          lt(rentals.startDate, newEndDate),
          gt(rentals.endDate, rental.startDate),
        ),
      )
      .limit(1)

    if (overlap.length > 0)
      throw new Error('Cannot extend — another booking overlaps with the new end date.')

    const newTotalSen = calcTotalSen(rental.dailyRateSen, rental.startDate, newEndDate)

    const result = await db
      .update(rentals)
      .set({ endDate: newEndDate, totalAmountSen: newTotalSen, updatedAt: new Date() })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    return result[0]
  })

export const deleteRental = createServerFn({ method: 'POST' })
  .inputValidator((input: DeleteRentalInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner'])
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
