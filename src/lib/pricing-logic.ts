/**
 * Season-based pricing logic — implementation of pricing_logic_spec_v2.md
 *
 * All functions are pure (no DB access). Amounts are in Malaysian Ringgit (RM),
 * NOT in sen, to match the CSV source data and the spec formulae.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SeasonType = 'Low' | 'Peak' | 'Super Peak'

export type SeasonRange = {
  fromDate: Date
  toDate: Date
  seasonType: SeasonType
}

export type CarPricing = {
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
}

export type BookingAddOns = {
  childSeat: boolean
  secondDriver: boolean
}

export type DayEntry = {
  date: Date
  seasonType: SeasonType
}

export type ExtraHoursResult = {
  hours: number
  charge: number // RM (not sen)
  appliedRule: 'none' | 'hourly' | 'full-day-cap'
  hourlyRate?: number
  capDayRate?: number
}

export type PricingBreakdown = {
  days: number
  baseRental: number       // RM
  extraHours: number
  extraCharge: number      // RM
  extraRule: 'none' | 'hourly' | 'full-day-cap'
  addonsTotal: number      // RM
  deliveryFee: number      // RM
  subTotal: number         // RM
  discountPercent: number
  discountAmount: number   // RM
  finalTotal: number       // RM (rounded)
  stripeAmount: number     // MYR cents
  breakdown: DayEntry[]
}

export type PromoRecord = {
  title: string
  discount: number        // percentage e.g. 10 = 10%
  usageLeft: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function combineDateTime(date: Date, timeHms: string): Date {
  const [h, m, s] = timeHms.split(':').map(Number)
  const dt = new Date(date)
  dt.setHours(h, m, s ?? 0, 0)
  return dt
}

// ─── Step 1: Count days by season ─────────────────────────────────────────────

export function lookupSeason(day: Date, calendar: SeasonRange[]): SeasonType {
  const d = stripTime(day)
  for (const range of calendar) {
    if (d >= stripTime(range.fromDate) && d <= stripTime(range.toDate)) {
      return range.seasonType
    }
  }
  return 'Low' // safe fallback
}

/** Returns one entry per charged day. Return day is NOT included. */
export function getRentalDays(pickUpDate: Date, returnDate: Date, calendar: SeasonRange[]): DayEntry[] {
  const days: DayEntry[] = []
  const start = stripTime(pickUpDate)
  const end = stripTime(returnDate)

  const current = new Date(start)
  while (current < end) {
    days.push({ date: new Date(current), seasonType: lookupSeason(current, calendar) })
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function countRentalDays(pickUpDate: Date, returnDate: Date): number {
  const start = stripTime(pickUpDate)
  const end = stripTime(returnDate)
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Step 2: Base rental ──────────────────────────────────────────────────────

export function calculateBaseRental(days: DayEntry[], car: CarPricing): number {
  const rateMapSen: Record<SeasonType, number> = {
    Low: car.priceLowSeasonSen,
    Peak: car.pricePeakSeasonSen,
    'Super Peak': car.priceSuperPeakSeasonSen,
  }
  const totalSen = days.reduce((sum, day) => sum + rateMapSen[day.seasonType], 0)
  return totalSen / 100
}

// ─── Step 3: Extra hours (Option 1 — full timestamp comparison) ───────────────

const FULL_DAY_CAP_THRESHOLD = 6

export function calculateExtraHours(
  pickUpDate: Date,
  pickUpTime: string,
  returnDate: Date,
  returnTime: string,
  days: DayEntry[],
  car: CarPricing,
): ExtraHoursResult {
  if (days.length === 0) return { hours: 0, charge: 0, appliedRule: 'none' }

  // Option 1: full timestamp comparison
  const pickupTs = combineDateTime(pickUpDate, pickUpTime)
  const returnTs = combineDateTime(returnDate, returnTime)
  const scheduledEnd = new Date(pickupTs.getTime() + days.length * 24 * 60 * 60 * 1000)

  const extraMs = returnTs.getTime() - scheduledEnd.getTime()
  const extraHours = Math.max(0, extraMs / (1000 * 60 * 60))

  if (extraHours === 0) return { hours: 0, charge: 0, appliedRule: 'none' }

  // Rule C: rate from last billing day
  const lastDay = days[days.length - 1]
  const isLow = lastDay.seasonType === 'Low'
  const hourlyRateSen = isLow ? car.extHourLowSen : car.extHourPeakAndSuperPeakSen
  const dayRateSen =
    lastDay.seasonType === 'Low'
      ? car.priceLowSeasonSen
      : lastDay.seasonType === 'Peak'
        ? car.pricePeakSeasonSen
        : car.priceSuperPeakSeasonSen

  const hourlyRate = hourlyRateSen / 100
  const dayRate = dayRateSen / 100

  // Rule A: full-day cap at >= 6 extra hours
  if (extraHours >= FULL_DAY_CAP_THRESHOLD) {
    const extraDays = Math.ceil(extraHours / 24)
    return {
      hours: extraHours,
      charge: extraDays * dayRate,
      appliedRule: 'full-day-cap',
      capDayRate: dayRate,
    }
  }

  return {
    hours: extraHours,
    charge: extraHours * hourlyRate,
    appliedRule: 'hourly',
    hourlyRate,
  }
}

// ─── Step 4: Add-ons ──────────────────────────────────────────────────────────

const CHILD_SEAT_RM = 30
const SECOND_DRIVER_RM = 20

export function calculateAddons(addOns: BookingAddOns): number {
  return (addOns.childSeat ? CHILD_SEAT_RM : 0) + (addOns.secondDriver ? SECOND_DRIVER_RM : 0)
}

// ─── Step 5: Delivery fee ─────────────────────────────────────────────────────

export function calculateDeliveryFee(
  pickUpLocation: string,
  returnLocation: string,
  car: CarPricing,
): number {
  const feeSen = (loc: string): number => {
    switch (loc) {
      case 'Airport':
        return car.deliveryFeeAirportSen
      case 'Hotel':
        return car.deliveryFeeHotelSen
      case 'Jetty':
        return car.deliveryFeeAirportSen
      case 'Office':
        return 0
      default:
        return 0
    }
  }
  return (feeSen(pickUpLocation) + feeSen(returnLocation)) / 100
}

// ─── Step 6: Coupon discount ──────────────────────────────────────────────────

export type CouponResult = {
  discountPercent: number
  discountAmount: number
  error?: 'not-found' | 'expired'
}

export function applyCoupon(
  code: string | undefined | null,
  subTotal: number,
  promos: PromoRecord[],
): CouponResult {
  if (!code) return { discountPercent: 0, discountAmount: 0 }

  const normalized = code.toUpperCase().trim()
  const promo = promos.find((p) => p.title.toUpperCase() === normalized)

  if (!promo) return { discountPercent: 0, discountAmount: 0, error: 'not-found' }
  if (promo.usageLeft <= 0) return { discountPercent: 0, discountAmount: 0, error: 'expired' }

  return {
    discountPercent: promo.discount,
    discountAmount: subTotal * (promo.discount / 100),
  }
}

// ─── Step 7: Validation ───────────────────────────────────────────────────────

export type ValidationResult = { ok: true } | { ok: false; error: string }

export function validateBooking(
  car: CarPricing,
  pickUpDate: Date,
  returnDate: Date,
): ValidationResult {
  if (car.status !== 'Active' && car.status !== 'active' && car.status !== 'available') {
    return { ok: false, error: 'Car is not available' }
  }
  if (!car.availableForBooking) {
    return { ok: false, error: 'Car is not bookable' }
  }

  const pu = stripTime(pickUpDate)
  const ret = stripTime(returnDate)

  if (ret <= pu) {
    return { ok: false, error: 'Return date must be at least one day after pickup date' }
  }

  const days = countRentalDays(pickUpDate, returnDate)
  if (days < 1) return { ok: false, error: 'Minimum rental is 1 day' }
  if (days < car.minRentalDays) return { ok: false, error: `Minimum rental is ${car.minRentalDays} day(s)` }
  if (days > car.maxRentalDays) return { ok: false, error: `Maximum rental is ${car.maxRentalDays} day(s)` }

  return { ok: true }
}

// ─── Step 8: Final total orchestration ───────────────────────────────────────

export function computeFinalTotal(
  car: CarPricing,
  pickUpDate: Date,
  pickUpTime: string,
  returnDate: Date,
  returnTime: string,
  pickUpLocation: string,
  returnLocation: string,
  addOns: BookingAddOns,
  calendar: SeasonRange[],
  promos: PromoRecord[],
  couponCode?: string | null,
): { error: string } | PricingBreakdown {
  const validation = validateBooking(car, pickUpDate, returnDate)
  if (!validation.ok) return { error: validation.error }

  const days = getRentalDays(pickUpDate, returnDate, calendar)
  const baseRental = calculateBaseRental(days, car)
  const extraResult = calculateExtraHours(pickUpDate, pickUpTime, returnDate, returnTime, days, car)
  const addonsTotal = calculateAddons(addOns)
  const deliveryFee = calculateDeliveryFee(pickUpLocation, returnLocation, car)

  const subTotal = baseRental + extraResult.charge + addonsTotal + deliveryFee
  const { discountAmount, discountPercent } = applyCoupon(couponCode, subTotal, promos)
  const finalTotal = Math.round(subTotal - discountAmount)

  return {
    days: days.length,
    baseRental,
    extraHours: extraResult.hours,
    extraCharge: extraResult.charge,
    extraRule: extraResult.appliedRule,
    addonsTotal,
    deliveryFee,
    subTotal,
    discountPercent,
    discountAmount,
    finalTotal,
    stripeAmount: finalTotal * 100,
    breakdown: days,
  }
}
