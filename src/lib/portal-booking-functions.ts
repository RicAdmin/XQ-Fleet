import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm'

import { cars, customers, payments, rentals } from '#/db/schema'
import type { CarCategory, RentalStatus } from '#/db/schema'
import { getRequestSession } from '#/lib/auth-functions'
import { HOLD_MINUTES } from '#/lib/payment-functions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CustomerFacingStatus =
  | 'Pending Payment'
  | 'Confirmed'
  | 'Active'
  | 'Completed'
  | 'Cancelled'

export function deriveCustomerStatus(
  rentalStatus: RentalStatus,
  paymentStatus: string,
): CustomerFacingStatus {
  if (rentalStatus === 'cancelled') return 'Cancelled'
  if (rentalStatus === 'active') return 'Active'
  if (rentalStatus === 'closed') return 'Completed'
  // pending
  if (paymentStatus === 'paid') return 'Confirmed'
  return 'Pending Payment'
}

export type BookingListItem = {
  id: string
  carId: string
  carMake: string
  carModel: string
  carYear: number
  carCategory: CarCategory
  coverPhotoUrl: string | null
  startDate: Date
  endDate: Date
  dailyRateSen: number
  totalAmountSen: number
  rentalStatus: RentalStatus
  paymentStatus: string
  customerStatus: CustomerFacingStatus
  createdAt: Date
}

export type BookingDetail = {
  id: string
  carId: string
  carMake: string
  carModel: string
  carYear: number
  carPlateNumber: string
  carCategory: CarCategory
  coverPhotoUrl: string | null
  startDate: Date
  endDate: Date
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  paidAmountSen: number
  rentalStatus: RentalStatus
  paymentStatus: string
  customerStatus: CustomerFacingStatus
  createdAt: Date
}

type CreatePortalBookingInput = {
  carId: string
  startDate: string
  endDate: string
  fullName: string
  icOrPassport: string
  phone: string
  address?: string
}

// ─── Create portal booking ────────────────────────────────────────────────────

export const createPortalBooking = createServerFn({ method: 'POST' })
  .inputValidator((input: CreatePortalBookingInput) => input)
  .handler(async ({ data }): Promise<{ rentalId: string }> => {
    const session = await getRequestSession()
    if (!session) throw new Error('You must be signed in to book a car.')

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      throw new Error('Invalid dates provided.')
    if (endDate <= startDate) throw new Error('Return date must be after pickup date.')

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)

    const fullName = data.fullName.trim()
    const icOrPassport = data.icOrPassport.trim()
    const phone = data.phone.trim()
    if (!fullName) throw new Error('Full name is required.')
    if (!icOrPassport) throw new Error('IC or passport number is required.')
    if (!phone) throw new Error('Phone number is required.')

    const { db } = await import('#/db')

    // Expire any stale holds before checking availability
    const { expirePaymentHolds } = await import('#/lib/payment-functions')
    await expirePaymentHolds()

    // Check overlap (excluding already-cancelled)
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
      throw new Error('This car is not available for the selected dates.')

    // Get car to calculate total
    const [car] = await db
      .select({ id: cars.id, dailyRateSen: cars.dailyRateSen, status: cars.status })
      .from(cars)
      .where(eq(cars.id, data.carId))
      .limit(1)
    if (!car) throw new Error('Car not found.')
    if (car.status !== 'available')
      throw new Error('This car is not currently available for booking.')

    const totalAmountSen = car.dailyRateSen * days

    // Look up customer by IC/passport; link authUserId if found; else create
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.icOrPassport, icOrPassport))
      .limit(1)

    let customerId: string
    if (existingCustomer) {
      customerId = existingCustomer.id
      // Link auth user if not already linked
      if (!existingCustomer.authUserId) {
        await db
          .update(customers)
          .set({ authUserId: session.user.id, updatedAt: new Date() })
          .where(eq(customers.id, existingCustomer.id))
      }
    } else {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          authUserId: session.user.id,
          fullName,
          icOrPassport,
          phone,
          email: session.user.email,
          address: data.address?.trim() || null,
        })
        .returning({ id: customers.id })
      customerId = newCustomer.id
    }

    // Load payment settings to determine deposit amount
    const { getPaymentSettings } = await import('#/lib/settings-functions')
    const paymentConfig = await getPaymentSettings()
    const depositAmountSen =
      paymentConfig.paymentMode === 'deposit' ? paymentConfig.depositAmountSen : 0

    const holdExpiry = new Date(Date.now() + HOLD_MINUTES * 60 * 1000)

    // Create rental
    const [rental] = await db
      .insert(rentals)
      .values({
        carId: data.carId,
        customerId,
        type: 'booking',
        status: 'pending',
        paymentStatus: 'unpaid',
        startDate,
        endDate,
        dailyRateSen: car.dailyRateSen,
        totalAmountSen,
        depositAmountSen,
        paidAmountSen: 0,
        paymentHoldExpiresAt: holdExpiry,
        createdByUserId: session.user.id,
      })
      .returning({ id: rentals.id })

    // Set car to payment-pending
    await db
      .update(cars)
      .set({ status: 'payment-pending', updatedAt: new Date() })
      .where(eq(cars.id, data.carId))

    // Create pending payment record
    if (paymentConfig.enabled) {
      const chargeSen =
        paymentConfig.paymentMode === 'deposit' && paymentConfig.depositAmountSen > 0
          ? paymentConfig.depositAmountSen
          : totalAmountSen
      await db.insert(payments).values({
        rentalId: rental.id,
        provider: 'ipay88',
        amountSen: chargeSen,
        currency: 'MYR',
        status: 'pending',
      })
    }

    return { rentalId: rental.id }
  })

// ─── Get customer bookings ────────────────────────────────────────────────────

export const getCustomerBookings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BookingListItem[]> => {
    const session = await getRequestSession()
    if (!session) throw new Error('You must be signed in.')

    const { db } = await import('#/db')
    const { carPhotos } = await import('#/db/schema')

    // Find customer record linked to this auth user
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.authUserId, session.user.id))
      .limit(1)
    if (!customer) return []

    const rows = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        carMake: cars.make,
        carModel: cars.model,
        carYear: cars.year,
        carCategory: cars.category,
        coverPhotoUrl: carPhotos.url,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        rentalStatus: rentals.status,
        paymentStatus: rentals.paymentStatus,
        createdAt: rentals.createdAt,
      })
      .from(rentals)
      .innerJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(
        carPhotos,
        and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
      )
      .where(eq(rentals.customerId, customer.id))
      .orderBy(desc(rentals.createdAt))

    return rows.map((r) => ({
      ...r,
      customerStatus: deriveCustomerStatus(r.rentalStatus, r.paymentStatus),
    }))
  },
)

// ─── Portal customer profile (linked auth user) ───────────────────────────────

export type PortalCustomerProfile = {
  id: string
  fullName: string | null
  phone: string | null
  email: string | null
}

export const getPortalCustomerProfile = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PortalCustomerProfile | null> => {
    const session = await getRequestSession()
    if (!session) throw new Error('You must be signed in.')

    const { db } = await import('#/db')

    const [row] = await db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .where(eq(customers.authUserId, session.user.id))
      .limit(1)

    return row ?? null
  },
)

type UpdatePortalCustomerProfileInput = {
  fullName: string
  phone: string
}

export const updatePortalCustomerProfile = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdatePortalCustomerProfileInput) => input)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; reason: 'no_customer' }> => {
    const session = await getRequestSession()
    if (!session) throw new Error('You must be signed in.')

    const { db } = await import('#/db')

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.authUserId, session.user.id))
      .limit(1)

    if (!customer) return { ok: false, reason: 'no_customer' }

    await db
      .update(customers)
      .set({
        fullName: data.fullName.trim() || null,
        phone: data.phone.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id))

    return { ok: true }
  })

// ─── Get booking detail ───────────────────────────────────────────────────────

type GetBookingDetailInput = { rentalId: string }

export const getBookingDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: GetBookingDetailInput) => input)
  .handler(async ({ data }): Promise<BookingDetail | null> => {
    const session = await getRequestSession()
    if (!session) throw new Error('You must be signed in.')

    const { db } = await import('#/db')
    const { carPhotos } = await import('#/db/schema')

    // Verify this rental belongs to the authenticated customer
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.authUserId, session.user.id))
      .limit(1)
    if (!customer) return null

    const [row] = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        carMake: cars.make,
        carModel: cars.model,
        carYear: cars.year,
        carPlateNumber: cars.plateNumber,
        carCategory: cars.category,
        coverPhotoUrl: carPhotos.url,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        rentalStatus: rentals.status,
        paymentStatus: rentals.paymentStatus,
        createdAt: rentals.createdAt,
      })
      .from(rentals)
      .innerJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(
        carPhotos,
        and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
      )
      .where(and(eq(rentals.id, data.rentalId), eq(rentals.customerId, customer.id)))
      .limit(1)

    if (!row) return null
    return { ...row, customerStatus: deriveCustomerStatus(row.rentalStatus, row.paymentStatus) }
  })
