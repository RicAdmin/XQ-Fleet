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
  deliveryFeeJettySen: number
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
  amountSen: number        // finalTotal in sen (for payment gateway)
  breakdown: DayEntry[]
}

export type PromoRecord = {
  /** Legacy alias for `code`. */
  title: string
  /** Legacy alias for percent-equivalent discount. */
  discount: number        // percentage e.g. 10 = 10%
  /** Legacy free-slot counter (kept for backward compat). */
  usageLeft: number
}

/** Extended promo record with full Phase-2 metadata. */
export type FullPromoRecord = {
  id: string
  code: string
  discountType: 'percent' | 'fixed'
  /** Sen for fixed; whole percent (0-100) for percent. */
  discountValueSen: number
  maxRedemptions: number | null
  redemptionsUsed: number
  perUserLimit: number | null
  minBookingAmountSen: number
  applicableCarCategories: ReadonlyArray<string>
  startsAt: Date | null
  endsAt: Date | null
  isActive: boolean
  stackableWithAffiliate: boolean
}

/** Cart context the promo engine needs to evaluate eligibility. */
export type CouponCartContext = {
  /** Subtotal in RM (post-extra-hours, pre-discount). */
  subTotalRm: number
  /** Car category for category-restricted promos. */
  carCategory?: string
  /** Customer redemption history for per-user limit. */
  redemptionsByThisCustomer?: number
  /** Optional now() override for deterministic tests. */
  now?: Date
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

/** Preset location codes from the legacy booking form — never charged a delivery fee. */
const PRESET_PRICING_LOCATIONS = new Set(['Office', 'Airport', 'Jetty', 'Hotel'])

/** Hotel names picked from the autocomplete list (not free-typed). */
const HOTEL_LIST_SUFFIXES = [' · hotel delivery', ' · penghantaran hotel', ' · 酒店配送'] as const

/**
 * True when the customer typed a custom pickup/return place (e.g. villa, homestay).
 * Preset airport/jetty meet points and hotel-list picks are free.
 */
export function isCustomDeliveryLocation(label: string): boolean {
  const trimmed = label.trim()
  if (!trimmed) return false
  if (PRESET_PRICING_LOCATIONS.has(trimmed)) return false

  const lower = trimmed.toLowerCase()
  if (
    lower.includes('intl airport') ||
    lower.includes('international airport') ||
    lower.includes('lapangan terbang') ||
    lower.includes('国际机场') ||
    lower.includes('door 3') ||
    lower.includes('pintu 3') ||
    lower.includes('3号门') ||
    (lower.includes('ferry') && lower.includes('jetty')) ||
    lower.includes('jeti feri') ||
    lower.includes('渡轮码头')
  ) {
    return false
  }

  if (HOTEL_LIST_SUFFIXES.some((suffix) => trimmed.includes(suffix))) return false

  return true
}

/** Delivery fee applies only when pickup is a custom typed location. */
export function calculateDeliveryFee(
  pickUpLocation: string,
  _returnLocation: string,
  car: CarPricing,
): number {
  if (!isCustomDeliveryLocation(pickUpLocation)) return 0
  return car.deliveryFeeHotelSen / 100
}

// ─── Step 6: Coupon discount ──────────────────────────────────────────────────

export type CouponError =
  | 'not-found'
  | 'expired'
  | 'inactive'
  | 'scheduled'
  | 'exhausted'
  | 'min-amount'
  | 'category'
  | 'per-user-limit'

export type CouponResult = {
  discountPercent: number
  discountAmount: number
  error?: CouponError
}

/** Legacy applyCoupon — retained for backwards-compat (LandingCheckoutFlow). */
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

/**
 * Phase-2 promo evaluation: full discountType + min/category/schedule/per-user
 * + max-redemptions checks. Pure / DB-free; pass DB-loaded promo + counters.
 *
 * Returns either a successful discount or an error code (see `CouponError`).
 */
export type ApplyPromoResult =
  | {
      ok: true
      discountPercent: number
      discountRm: number
      discountSen: number
    }
  | { ok: false; error: CouponError }

export function applyPromoV2(
  code: string | undefined | null,
  promo: FullPromoRecord | null,
  ctx: CouponCartContext,
): ApplyPromoResult {
  if (!code) return { ok: false, error: 'not-found' }
  if (!promo) return { ok: false, error: 'not-found' }

  const now = ctx.now ?? new Date()

  if (!promo.isActive) return { ok: false, error: 'inactive' }

  if (promo.startsAt && now < promo.startsAt) {
    return { ok: false, error: 'scheduled' }
  }
  if (promo.endsAt && now > promo.endsAt) {
    return { ok: false, error: 'expired' }
  }

  if (
    promo.maxRedemptions != null &&
    promo.redemptionsUsed >= promo.maxRedemptions
  ) {
    return { ok: false, error: 'exhausted' }
  }

  const subTotalSen = Math.round(ctx.subTotalRm * 100)
  if (subTotalSen < promo.minBookingAmountSen) {
    return { ok: false, error: 'min-amount' }
  }

  if (
    promo.applicableCarCategories.length > 0 &&
    ctx.carCategory &&
    !promo.applicableCarCategories.includes(ctx.carCategory)
  ) {
    return { ok: false, error: 'category' }
  }

  if (
    promo.perUserLimit != null &&
    ctx.redemptionsByThisCustomer != null &&
    ctx.redemptionsByThisCustomer >= promo.perUserLimit
  ) {
    return { ok: false, error: 'per-user-limit' }
  }

  let discountRm: number
  let discountPercent: number

  if (promo.discountType === 'percent') {
    discountPercent = Math.min(100, Math.max(0, promo.discountValueSen))
    discountRm = (ctx.subTotalRm * discountPercent) / 100
  } else {
    const fixedRm = promo.discountValueSen / 100
    discountRm = Math.min(ctx.subTotalRm, fixedRm)
    discountPercent =
      ctx.subTotalRm > 0 ? Math.round((discountRm / ctx.subTotalRm) * 10000) / 100 : 0
  }

  return {
    ok: true,
    discountPercent,
    discountRm,
    discountSen: Math.round(discountRm * 100),
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
    amountSen: finalTotal * 100,
    breakdown: days,
  }
}
