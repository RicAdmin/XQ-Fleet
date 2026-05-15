import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gt, inArray, lt } from 'drizzle-orm'

import { cars, customers, payments, rentals, seasonCalendar, promos } from '#/db/schema'
import type { CarCategory, RentalStatus } from '#/db/schema'
import { getRequestSession } from '#/lib/auth-functions'
import { HOLD_MINUTES } from '#/lib/payment-functions'
import {
  computeFinalTotal,
  type BookingAddOns,
  type CarPricing,
  type PricingBreakdown,
  type PromoRecord,
  type SeasonRange,
} from '#/lib/pricing-logic'

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
  pickUpTime: string | null
  returnTime: string | null
  pickUpLocation: string | null
  returnLocation: string | null
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  paidAmountSen: number
  // Pricing breakdown (may be 0 for legacy bookings without season pricing)
  baseRentalSen: number
  extraChargeSen: number
  extraRule: string
  addonsTotalSen: number
  deliveryFeeSen: number
  discountPercent: string
  discountAmountSen: number
  subTotalSen: number
  childSeat: boolean
  secondDriver: boolean
  couponCode: string | null
  rentalStatus: RentalStatus
  paymentStatus: string
  customerStatus: CustomerFacingStatus
  createdAt: Date
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loadCalendar(): Promise<SeasonRange[]> {
  const { db } = await import('#/db')
  const rows = await db.select().from(seasonCalendar)
  return rows.map((r) => ({
    fromDate: r.fromDate,
    toDate: r.toDate,
    seasonType: r.seasonType,
  }))
}

async function loadPromos(couponCode?: string | null): Promise<PromoRecord[]> {
  if (!couponCode) return []
  const { db } = await import('#/db')
  const normalized = couponCode.toUpperCase().trim()
  const rows = await db.select().from(promos).where(eq(promos.title, normalized))
  return rows.map((r) => ({
    title: r.title,
    discount: Number(r.discount),
    usageLeft: r.usageLeft,
  }))
}

function carToPricing(car: {
  status: string
  availableForBooking: boolean
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
  extHourLowSen: number
  extHourPeakAndSuperPeakSen: number
  deliveryFeeAirportSen: number
  deliveryFeeHotelSen: number
  minRentalDays: number
  maxRentalDays: number
}): CarPricing {
  return {
    status: car.status === 'available' ? 'Active' : car.status,
    availableForBooking: car.availableForBooking,
    priceLowSeasonSen: car.priceLowSeasonSen,
    pricePeakSeasonSen: car.pricePeakSeasonSen,
    priceSuperPeakSeasonSen: car.priceSuperPeakSeasonSen,
    extHourLowSen: car.extHourLowSen,
    extHourPeakAndSuperPeakSen: car.extHourPeakAndSuperPeakSen,
    deliveryFeeAirportSen: car.deliveryFeeAirportSen,
    deliveryFeeHotelSen: car.deliveryFeeHotelSen,
    minRentalDays: car.minRentalDays,
    maxRentalDays: car.maxRentalDays,
  }
}

// ─── Preview booking price (no DB write) ─────────────────────────────────────

type PreviewBookingPriceInput = {
  carId: string
  startDate: string       // YYYY-MM-DD
  endDate: string         // YYYY-MM-DD
  pickUpTime: string      // HH:MM:SS
  returnTime: string      // HH:MM:SS
  pickUpLocation: string
  returnLocation: string
  childSeat: boolean
  secondDriver: boolean
  couponCode?: string | null
}

export type PricingPreview = PricingBreakdown & { couponError?: 'not-found' | 'expired' }

export const previewBookingPrice = createServerFn({ method: 'GET' })
  .inputValidator((input: PreviewBookingPriceInput) => input)
  .handler(async ({ data }): Promise<PricingPreview | { error: string }> => {
    const { db } = await import('#/db')

    const [car] = await db
      .select({
        id: cars.id,
        status: cars.status,
        availableForBooking: cars.availableForBooking,
        priceLowSeasonSen: cars.priceLowSeasonSen,
        pricePeakSeasonSen: cars.pricePeakSeasonSen,
        priceSuperPeakSeasonSen: cars.priceSuperPeakSeasonSen,
        extHourLowSen: cars.extHourLowSen,
        extHourPeakAndSuperPeakSen: cars.extHourPeakAndSuperPeakSen,
        deliveryFeeAirportSen: cars.deliveryFeeAirportSen,
        deliveryFeeHotelSen: cars.deliveryFeeHotelSen,
        minRentalDays: cars.minRentalDays,
        maxRentalDays: cars.maxRentalDays,
      })
      .from(cars)
      .where(eq(cars.id, data.carId))
      .limit(1)

    if (!car) return { error: 'Car not found.' }

    const calendar = await loadCalendar()
    const promoList = await loadPromos(data.couponCode)

    const result = computeFinalTotal(
      carToPricing(car),
      new Date(data.startDate),
      data.pickUpTime,
      new Date(data.endDate),
      data.returnTime,
      data.pickUpLocation,
      data.returnLocation,
      { childSeat: data.childSeat, secondDriver: data.secondDriver },
      calendar,
      promoList,
      data.couponCode,
    )

    if ('error' in result) return result

    // Surface coupon validation error without blocking the preview
    let couponError: 'not-found' | 'expired' | undefined
    if (data.couponCode) {
      const { applyCoupon } = await import('#/lib/pricing-logic')
      const couponResult = applyCoupon(data.couponCode, result.subTotal, promoList)
      couponError = couponResult.error
    }

    return { ...result, couponError }
  })

// ─── Create portal booking ────────────────────────────────────────────────────

type CreatePortalBookingInput = {
  carId: string
  startDate: string
  endDate: string
  pickUpTime: string
  returnTime: string
  pickUpLocation: string
  returnLocation: string
  childSeat: boolean
  secondDriver: boolean
  couponCode?: string | null
  fullName: string
  icOrPassport: string
  phone: string
  address?: string
}

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

    const fullName = data.fullName.trim()
    const icOrPassport = data.icOrPassport.trim()
    const phone = data.phone.trim()
    if (!fullName) throw new Error('Full name is required.')
    if (!icOrPassport) throw new Error('IC or passport number is required.')
    if (!phone) throw new Error('Phone number is required.')

    const { db } = await import('#/db')

    const { expirePaymentHolds } = await import('#/lib/payment-functions')
    await expirePaymentHolds()

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
      throw new Error('This car is not available for the selected dates.')

    // Load car with season pricing
    const [car] = await db
      .select({
        id: cars.id,
        status: cars.status,
        availableForBooking: cars.availableForBooking,
        dailyRateSen: cars.dailyRateSen,
        priceLowSeasonSen: cars.priceLowSeasonSen,
        pricePeakSeasonSen: cars.pricePeakSeasonSen,
        priceSuperPeakSeasonSen: cars.priceSuperPeakSeasonSen,
        extHourLowSen: cars.extHourLowSen,
        extHourPeakAndSuperPeakSen: cars.extHourPeakAndSuperPeakSen,
        deliveryFeeAirportSen: cars.deliveryFeeAirportSen,
        deliveryFeeHotelSen: cars.deliveryFeeHotelSen,
        minRentalDays: cars.minRentalDays,
        maxRentalDays: cars.maxRentalDays,
      })
      .from(cars)
      .where(eq(cars.id, data.carId))
      .limit(1)
    if (!car) throw new Error('Car not found.')
    if (car.status !== 'available')
      throw new Error('This car is not currently available for booking.')

    // Compute season-based pricing
    const calendar = await loadCalendar()
    const promoList = await loadPromos(data.couponCode)
    const addOns: BookingAddOns = { childSeat: data.childSeat, secondDriver: data.secondDriver }

    const pricing = computeFinalTotal(
      carToPricing(car),
      startDate,
      data.pickUpTime,
      endDate,
      data.returnTime,
      data.pickUpLocation,
      data.returnLocation,
      addOns,
      calendar,
      promoList,
      data.couponCode,
    )

    if ('error' in pricing) throw new Error(pricing.error)

    // Convert RM totals → sen for DB storage
    const baseRentalSen = Math.round(pricing.baseRental * 100)
    const extraChargeSen = Math.round(pricing.extraCharge * 100)
    const addonsTotalSen = Math.round(pricing.addonsTotal * 100)
    const deliveryFeeSen = Math.round(pricing.deliveryFee * 100)
    const discountAmountSen = Math.round(pricing.discountAmount * 100)
    const subTotalSen = Math.round(pricing.subTotal * 100)
    const totalAmountSen = pricing.finalTotal * 100 // already rounded

    // Upsert customer — check by authUserId first, then icOrPassport
    const { or } = await import('drizzle-orm')
    const existingRows = await db
      .select()
      .from(customers)
      .where(or(eq(customers.authUserId, session.user.id), eq(customers.icOrPassport, icOrPassport)))
      .limit(2)

    // Prefer the row already linked to this auth user
    const existingCustomer =
      existingRows.find((r) => r.authUserId === session.user.id) ?? existingRows[0] ?? null

    let customerId: string
    if (existingCustomer) {
      customerId = existingCustomer.id
      // Link authUserId and update profile fields on every booking
      await db
        .update(customers)
        .set({
          authUserId: session.user.id,
          fullName,
          icOrPassport,
          phone,
          email: session.user.email,
          address: data.address?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existingCustomer.id))
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

    const { getPaymentSettings } = await import('#/lib/settings-functions')
    const paymentConfig = await getPaymentSettings()
    const depositAmountSen =
      paymentConfig.paymentMode === 'deposit' ? paymentConfig.depositAmountSen : 0

    const holdExpiry = new Date(Date.now() + HOLD_MINUTES * 60 * 1000)

    // Create rental with full pricing breakdown
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
        pickUpTime: data.pickUpTime,
        returnTime: data.returnTime,
        pickUpLocation: data.pickUpLocation,
        returnLocation: data.returnLocation,
        childSeat: data.childSeat,
        secondDriver: data.secondDriver,
        couponCode: data.couponCode ?? null,
        dailyRateSen: car.dailyRateSen,
        baseRentalSen,
        extraHoursDecimal: String(pricing.extraHours),
        extraChargeSen,
        extraRule: pricing.extraRule,
        addonsTotalSen,
        deliveryFeeSen,
        discountPercent: String(pricing.discountPercent),
        discountAmountSen,
        subTotalSen,
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

    // Atomically decrement coupon if applied
    if (data.couponCode && pricing.discountPercent > 0 && promoList.length > 0) {
      const normalized = data.couponCode.toUpperCase().trim()
      await db
        .update(promos)
        .set({ usageLeft: promoList[0].usageLeft - 1, updatedAt: new Date() })
        .where(and(eq(promos.title, normalized), gt(promos.usageLeft, 0)))
    }

    // Always create a pending payment record so Pay Now can work even if settings change later
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

    return { rentalId: rental.id }
  })

// ─── Get customer bookings ────────────────────────────────────────────────────

export const getCustomerBookings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BookingListItem[]> => {
    const session = await getRequestSession()
    if (!session) throw new Error('You must be signed in.')

    const { db } = await import('#/db')
    const { carPhotos } = await import('#/db/schema')

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
      .leftJoin(carPhotos, and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)))
      .where(eq(rentals.customerId, customer.id))
      .orderBy(desc(rentals.createdAt))

    return rows.map((r) => ({
      ...r,
      customerStatus: deriveCustomerStatus(r.rentalStatus, r.paymentStatus),
    }))
  },
)

// ─── Portal customer profile ──────────────────────────────────────────────────

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
      .select({ id: customers.id, fullName: customers.fullName, phone: customers.phone, email: customers.email })
      .from(customers)
      .where(eq(customers.authUserId, session.user.id))
      .limit(1)

    return row ?? null
  },
)

type UpdatePortalCustomerProfileInput = { fullName: string; phone: string }

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
      .set({ fullName: data.fullName.trim() || null, phone: data.phone.trim() || null, updatedAt: new Date() })
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
        pickUpTime: rentals.pickUpTime,
        returnTime: rentals.returnTime,
        pickUpLocation: rentals.pickUpLocation,
        returnLocation: rentals.returnLocation,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        baseRentalSen: rentals.baseRentalSen,
        extraChargeSen: rentals.extraChargeSen,
        extraRule: rentals.extraRule,
        addonsTotalSen: rentals.addonsTotalSen,
        deliveryFeeSen: rentals.deliveryFeeSen,
        discountPercent: rentals.discountPercent,
        discountAmountSen: rentals.discountAmountSen,
        subTotalSen: rentals.subTotalSen,
        childSeat: rentals.childSeat,
        secondDriver: rentals.secondDriver,
        couponCode: rentals.couponCode,
        rentalStatus: rentals.status,
        paymentStatus: rentals.paymentStatus,
        createdAt: rentals.createdAt,
      })
      .from(rentals)
      .innerJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(carPhotos, and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)))
      .where(and(eq(rentals.id, data.rentalId), eq(rentals.customerId, customer.id)))
      .limit(1)

    if (!row) return null
    return { ...row, customerStatus: deriveCustomerStatus(row.rentalStatus, row.paymentStatus) }
  })
