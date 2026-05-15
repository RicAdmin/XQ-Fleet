import { describe, expect, it } from 'vitest'

import {
  applyCoupon,
  calculateAddons,
  calculateBaseRental,
  calculateDeliveryFee,
  calculateExtraHours,
  computeFinalTotal,
  getRentalDays,
  validateBooking,
} from './pricing-logic'
import type { CarPricing, PromoRecord, SeasonRange } from './pricing-logic'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Toyota Innova pricing (from spec examples)
const innova: CarPricing = {
  status: 'Active',
  availableForBooking: true,
  priceLowSeasonSen: 14000,     // RM 140
  pricePeakSeasonSen: 24000,    // RM 240
  priceSuperPeakSeasonSen: 28000, // RM 280
  extHourLowSen: 2000,          // RM 20
  extHourPeakAndSuperPeakSen: 3000, // RM 30
  deliveryFeeAirportSen: 3000,  // RM 30
  deliveryFeeJettySen: 3000,    // RM 30 (same as airport)
  deliveryFeeHotelSen: 5000,    // RM 50
  minRentalDays: 1,
  maxRentalDays: 30,
}

// Honda City 5G pricing (from spec Example D)
const hondaCity: CarPricing = {
  status: 'Active',
  availableForBooking: true,
  priceLowSeasonSen: 0,
  pricePeakSeasonSen: 0,
  priceSuperPeakSeasonSen: 19000, // RM 190
  extHourLowSen: 2000,
  extHourPeakAndSuperPeakSen: 3000,
  deliveryFeeAirportSen: 3000,  // RM 30
  deliveryFeeJettySen: 3000,    // RM 30 (same as airport)
  deliveryFeeHotelSen: 5000,    // RM 50
  minRentalDays: 1,
  maxRentalDays: 30,
}

// 2026 season calendar excerpt matching spec examples
const calendar2026: SeasonRange[] = [
  { fromDate: new Date('2026-01-01'), toDate: new Date('2026-01-01'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-01-02'), toDate: new Date('2026-01-10'), seasonType: 'Peak' },
  { fromDate: new Date('2026-01-11'), toDate: new Date('2026-01-29'), seasonType: 'Low' },
  { fromDate: new Date('2026-01-30'), toDate: new Date('2026-02-01'), seasonType: 'Peak' },
  { fromDate: new Date('2026-02-02'), toDate: new Date('2026-02-12'), seasonType: 'Low' },
  { fromDate: new Date('2026-02-13'), toDate: new Date('2026-02-14'), seasonType: 'Peak' },
  { fromDate: new Date('2026-02-15'), toDate: new Date('2026-02-21'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-02-22'), toDate: new Date('2026-02-22'), seasonType: 'Peak' },
  { fromDate: new Date('2026-02-23'), toDate: new Date('2026-03-18'), seasonType: 'Low' },
  { fromDate: new Date('2026-03-19'), toDate: new Date('2026-03-20'), seasonType: 'Peak' },
  { fromDate: new Date('2026-03-21'), toDate: new Date('2026-03-28'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-03-29'), toDate: new Date('2026-03-29'), seasonType: 'Peak' },
  { fromDate: new Date('2026-03-30'), toDate: new Date('2026-04-30'), seasonType: 'Low' },
  { fromDate: new Date('2026-05-01'), toDate: new Date('2026-05-03'), seasonType: 'Peak' },
  { fromDate: new Date('2026-05-04'), toDate: new Date('2026-05-21'), seasonType: 'Low' },
  { fromDate: new Date('2026-05-22'), toDate: new Date('2026-05-26'), seasonType: 'Peak' },
  { fromDate: new Date('2026-05-27'), toDate: new Date('2026-05-31'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-06-01'), toDate: new Date('2026-06-07'), seasonType: 'Peak' },
  { fromDate: new Date('2026-06-08'), toDate: new Date('2026-06-20'), seasonType: 'Low' },
  { fromDate: new Date('2026-06-21'), toDate: new Date('2026-06-21'), seasonType: 'Peak' },
  { fromDate: new Date('2026-06-22'), toDate: new Date('2026-08-27'), seasonType: 'Low' },
  { fromDate: new Date('2026-08-28'), toDate: new Date('2026-08-30'), seasonType: 'Peak' },
  { fromDate: new Date('2026-08-31'), toDate: new Date('2026-08-31'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-09-01'), toDate: new Date('2026-09-06'), seasonType: 'Peak' },
  { fromDate: new Date('2026-09-07'), toDate: new Date('2026-09-15'), seasonType: 'Low' },
  { fromDate: new Date('2026-09-16'), toDate: new Date('2026-09-16'), seasonType: 'Peak' },
  { fromDate: new Date('2026-09-17'), toDate: new Date('2026-11-05'), seasonType: 'Low' },
  { fromDate: new Date('2026-11-06'), toDate: new Date('2026-11-07'), seasonType: 'Peak' },
  { fromDate: new Date('2026-11-08'), toDate: new Date('2026-11-08'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-11-09'), toDate: new Date('2026-11-09'), seasonType: 'Peak' },
  { fromDate: new Date('2026-11-10'), toDate: new Date('2026-12-03'), seasonType: 'Low' },
  { fromDate: new Date('2026-12-04'), toDate: new Date('2026-12-23'), seasonType: 'Peak' },
  { fromDate: new Date('2026-12-24'), toDate: new Date('2026-12-26'), seasonType: 'Super Peak' },
  { fromDate: new Date('2026-12-27'), toDate: new Date('2026-12-30'), seasonType: 'Peak' },
  { fromDate: new Date('2026-12-31'), toDate: new Date('2026-12-31'), seasonType: 'Super Peak' },
]

const promos: PromoRecord[] = [
  { title: 'SUMMER10', discount: 10, usageLeft: 5 },
  { title: 'EXPIRED', discount: 20, usageLeft: 0 },
]

// ─── Day count and season lookup ──────────────────────────────────────────────

describe('season lookup and day counting', () => {
  // Test 1: single-day Low (Apr 15)
  it('1. single-day Low — Apr 15 to Apr 16 → 1 day, RM 140', () => {
    const pu = new Date('2026-04-15')
    const ret = new Date('2026-04-16')
    const days = getRentalDays(pu, ret, calendar2026)
    expect(days).toHaveLength(1)
    expect(days[0].seasonType).toBe('Low')
    expect(calculateBaseRental(days, innova)).toBe(140)
  })

  // Test 2: single-day Peak (May 22)
  it('2. single-day Peak — May 22 to May 23 → 1 day, RM 240', () => {
    const pu = new Date('2026-05-22')
    const ret = new Date('2026-05-23')
    const days = getRentalDays(pu, ret, calendar2026)
    expect(days).toHaveLength(1)
    expect(days[0].seasonType).toBe('Peak')
    expect(calculateBaseRental(days, innova)).toBe(240)
  })

  // Test 3: single-day Super Peak (Mar 21)
  it('3. single-day Super Peak — Mar 21 to Mar 22 → 1 day, RM 280', () => {
    const pu = new Date('2026-03-21')
    const ret = new Date('2026-03-22')
    const days = getRentalDays(pu, ret, calendar2026)
    expect(days).toHaveLength(1)
    expect(days[0].seasonType).toBe('Super Peak')
    expect(calculateBaseRental(days, innova)).toBe(280)
  })

  // Test 4: multi-day crossing Low to Peak (May 19 to May 23) → RM 660
  it('4. multi-day Low→Peak — May 19 to May 23 → 4 days, RM 660', () => {
    const pu = new Date('2026-05-19')
    const ret = new Date('2026-05-23')
    const days = getRentalDays(pu, ret, calendar2026)
    expect(days).toHaveLength(4)
    // May 19, 20, 21 = Low (RM 140 each), May 22 = Peak (RM 240)
    expect(days[0].seasonType).toBe('Low')
    expect(days[1].seasonType).toBe('Low')
    expect(days[2].seasonType).toBe('Low')
    expect(days[3].seasonType).toBe('Peak')
    expect(calculateBaseRental(days, innova)).toBe(660)
  })

  // Test 5: multi-day crossing all three seasons (May 20 to May 28)
  it('5. multi-day crossing all three seasons — May 20 to May 28', () => {
    const pu = new Date('2026-05-20')
    const ret = new Date('2026-05-28')
    const days = getRentalDays(pu, ret, calendar2026)
    expect(days).toHaveLength(8)
    // May 20,21 = Low; May 22-26 = Peak (5 days); May 27 = Super Peak (1 day)
    const low = days.filter((d) => d.seasonType === 'Low').length
    const peak = days.filter((d) => d.seasonType === 'Peak').length
    const sp = days.filter((d) => d.seasonType === 'Super Peak').length
    expect(low).toBe(2)
    expect(peak).toBe(5)
    expect(sp).toBe(1)
  })
})

// ─── Extra hours ──────────────────────────────────────────────────────────────

describe('extra hours', () => {
  const pu = new Date('2026-05-19')
  const ret = new Date('2026-05-23')
  const days4 = getRentalDays(pu, ret, calendar2026) // 4 days, last day Peak

  // Test 6: no extra hours (return time = pickup time)
  it('6. no extra hours (same return time) → charge 0', () => {
    const r = calculateExtraHours(pu, '08:00:00', ret, '08:00:00', days4, innova)
    expect(r.hours).toBe(0)
    expect(r.charge).toBe(0)
    expect(r.appliedRule).toBe('none')
  })

  // Test 7: return time < pickup time (Option 1: scheduled end = pickup + 4*24h = 8AM May 23)
  // Return at 07:00 May 23 → before scheduled end → no extra
  it('7. return time before pickup time → charge 0', () => {
    const r = calculateExtraHours(pu, '08:00:00', ret, '07:00:00', days4, innova)
    expect(r.hours).toBe(0)
    expect(r.charge).toBe(0)
    expect(r.appliedRule).toBe('none')
  })

  // Test 8: 1 hour extra, last day Low
  // 4 days May 15-18 in Low season (all Low), return 1h late
  it('8. 1 hour extra, last day Low → 1 × RM 20 = RM 20', () => {
    const puLow = new Date('2026-04-15')
    const retLow = new Date('2026-04-19')
    const daysLow = getRentalDays(puLow, retLow, calendar2026)
    const r = calculateExtraHours(puLow, '08:00:00', retLow, '09:00:00', daysLow, innova)
    expect(r.appliedRule).toBe('hourly')
    expect(r.hours).toBeCloseTo(1)
    expect(r.charge).toBeCloseTo(20)
  })

  // Test 9: 5 hours extra, last day Peak → 5 × RM 30 = RM 150 (under threshold)
  it('9. 5 hours extra, last day Peak → 5 × RM 30 = RM 150', () => {
    const r = calculateExtraHours(pu, '08:00:00', ret, '13:00:00', days4, innova)
    expect(r.appliedRule).toBe('hourly')
    expect(r.hours).toBeCloseTo(5)
    expect(r.charge).toBeCloseTo(150)
  })

  // Test 10: 6 hours extra, last day Peak → full-day cap RM 240 (NOT 6 × 30 = 180)
  it('10. 6 hours extra, last day Peak → full-day cap RM 240', () => {
    const r = calculateExtraHours(pu, '08:00:00', ret, '14:00:00', days4, innova)
    expect(r.appliedRule).toBe('full-day-cap')
    expect(r.charge).toBe(240)
  })

  // Test 11: 14 hours extra, last day Peak → full-day cap RM 240
  it('11. 14 hours extra, last day Peak → full-day cap RM 240', () => {
    const r = calculateExtraHours(pu, '08:00:00', ret, '22:00:00', days4, innova)
    expect(r.appliedRule).toBe('full-day-cap')
    expect(r.hours).toBeCloseTo(14)
    expect(r.charge).toBe(240)
  })

  // Test 12: 25 hours extra, last day Peak → 2 full days RM 480
  it('12. 25 hours extra, last day Peak → 2 full days RM 480', () => {
    const retNextDay = new Date('2026-05-24')
    const r = calculateExtraHours(pu, '08:00:00', retNextDay, '09:00:00', days4, innova)
    expect(r.appliedRule).toBe('full-day-cap')
    expect(r.hours).toBeCloseTo(25)
    expect(r.charge).toBe(480)
  })

  // Test 13: 14 hours extra, last day Super Peak → RM 280
  it('13. 14 hours extra, last day Super Peak → RM 280', () => {
    const puSP = new Date('2026-03-22')
    const retSP = new Date('2026-03-26')
    const daysSP = getRentalDays(puSP, retSP, calendar2026) // Mar 22-25 all Super Peak
    const r = calculateExtraHours(puSP, '08:00:00', retSP, '22:00:00', daysSP, innova)
    expect(r.appliedRule).toBe('full-day-cap')
    expect(r.charge).toBe(280)
  })

  // Test 14: 14 hours extra, last day Low → RM 140
  it('14. 14 hours extra, last day Low → RM 140', () => {
    const puLow2 = new Date('2026-04-13')
    const retLow2 = new Date('2026-04-17')
    const daysLow2 = getRentalDays(puLow2, retLow2, calendar2026)
    const r = calculateExtraHours(puLow2, '08:00:00', retLow2, '22:00:00', daysLow2, innova)
    expect(r.appliedRule).toBe('full-day-cap')
    expect(r.charge).toBe(140)
  })
})

// ─── Validation ───────────────────────────────────────────────────────────────

describe('validation', () => {
  // Test 15: same-day rental rejected
  it('15. same-day rental (pickup = return date) rejected', () => {
    const d = new Date('2026-05-15')
    const v = validateBooking(innova, d, d)
    expect(v.ok).toBe(false)
  })

  // Test 16: return before pickup rejected
  it('16. return before pickup rejected', () => {
    const v = validateBooking(innova, new Date('2026-05-16'), new Date('2026-05-15'))
    expect(v.ok).toBe(false)
  })

  // Test 17: exceeds max rental days rejected
  it('17. exceeds maxRentalDays rejected', () => {
    const car = { ...innova, maxRentalDays: 3 }
    const v = validateBooking(car, new Date('2026-05-01'), new Date('2026-05-10'))
    expect(v.ok).toBe(false)
  })

  // Test 18: inactive car rejected
  it('18. inactive car booking rejected', () => {
    const car = { ...innova, status: 'retired' }
    const v = validateBooking(car, new Date('2026-05-15'), new Date('2026-05-16'))
    expect(v.ok).toBe(false)
  })

  // Test 19: availableForBooking false rejected (covers "all units booked" proxy at validation layer)
  it('19. availableForBooking=false rejected', () => {
    const car = { ...innova, availableForBooking: false }
    const v = validateBooking(car, new Date('2026-05-15'), new Date('2026-05-16'))
    expect(v.ok).toBe(false)
  })
})

// ─── Coupons ──────────────────────────────────────────────────────────────────

describe('coupons', () => {
  // Test 20: valid coupon 10% applied correctly
  it('20. valid coupon 10% on RM 100 → discount RM 10', () => {
    const r = applyCoupon('SUMMER10', 100, promos)
    expect(r.discountPercent).toBe(10)
    expect(r.discountAmount).toBeCloseTo(10)
    expect(r.error).toBeUndefined()
  })

  // Test 21: invalid coupon → error, no discount
  it('21. invalid coupon → error, no discount', () => {
    const r = applyCoupon('NOTEXIST', 100, promos)
    expect(r.discountPercent).toBe(0)
    expect(r.discountAmount).toBe(0)
    expect(r.error).toBe('not-found')
  })

  // Test 22: expired coupon → error, no discount
  it('22. expired coupon (usageLeft=0) → error, no discount', () => {
    const r = applyCoupon('EXPIRED', 100, promos)
    expect(r.discountPercent).toBe(0)
    expect(r.discountAmount).toBe(0)
    expect(r.error).toBe('expired')
  })

  // Test 23: coupon code matching is case-insensitive
  it('23. coupon code is case-insensitive', () => {
    const r = applyCoupon('summer10', 100, promos)
    expect(r.discountPercent).toBe(10)
    expect(r.error).toBeUndefined()
  })

  // Test 24: coupon applies to entire subtotal including delivery
  it('24. coupon applies to full subtotal including delivery', () => {
    const subTotal = 680 // from Example D
    const r = applyCoupon('SUMMER10', subTotal, promos)
    expect(r.discountAmount).toBeCloseTo(68)
  })
})

// ─── Add-ons and delivery ─────────────────────────────────────────────────────

describe('add-ons and delivery', () => {
  // Test 25: child seat only
  it('25. child seat only → RM 30', () => {
    expect(calculateAddons({ childSeat: true, secondDriver: false })).toBe(30)
  })

  // Test 26: second driver only
  it('26. second driver only → RM 20', () => {
    expect(calculateAddons({ childSeat: false, secondDriver: true })).toBe(20)
  })

  // Test 27: both → RM 50
  it('27. both add-ons → RM 50', () => {
    expect(calculateAddons({ childSeat: true, secondDriver: true })).toBe(50)
  })

  // Test 28: Airport pickup + Hotel return → RM 30 + RM 50 = RM 80
  it('28. Airport pickup + Hotel return → RM 80', () => {
    expect(calculateDeliveryFee('Airport', 'Hotel', innova)).toBe(80)
  })

  // Test 29: Office + Office → RM 0
  it('29. Office pickup + Office return → RM 0', () => {
    expect(calculateDeliveryFee('Office', 'Office', innova)).toBe(0)
  })
})

// ─── Integration ──────────────────────────────────────────────────────────────

describe('integration examples', () => {
  // Test 30: Example A — Innova May 19–23, no extras → RM 660
  it('30. Example A — Innova May 19 8AM to May 23 8AM → RM 660', () => {
    const result = computeFinalTotal(
      innova,
      new Date('2026-05-19'),
      '08:00:00',
      new Date('2026-05-23'),
      '08:00:00',
      'Office',
      'Office',
      { childSeat: false, secondDriver: false },
      calendar2026,
      promos,
    )
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.days).toBe(4)
    expect(result.baseRental).toBe(660)
    expect(result.extraCharge).toBe(0)
    expect(result.finalTotal).toBe(660)
  })

  // Test 31: Example B — Innova May 19 8AM to May 23 10PM (14h extra) → RM 900
  it('31. Example B — Innova May 19 8AM to May 23 10PM → RM 900', () => {
    const result = computeFinalTotal(
      innova,
      new Date('2026-05-19'),
      '08:00:00',
      new Date('2026-05-23'),
      '22:00:00',
      'Office',
      'Office',
      { childSeat: false, secondDriver: false },
      calendar2026,
      promos,
    )
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.extraRule).toBe('full-day-cap')
    expect(result.extraCharge).toBe(240)
    expect(result.finalTotal).toBe(900)
  })

  // Test 32: Example D — Honda City Dec 24–27, airport pickup, hotel return, child seat, SUMMER10 → RM 612
  it('32. Example D — Honda City Dec 24 to Dec 27, all extras → RM 612', () => {
    const result = computeFinalTotal(
      hondaCity,
      new Date('2026-12-24'),
      '08:00:00',
      new Date('2026-12-27'),
      '08:00:00',
      'Airport',
      'Hotel',
      { childSeat: true, secondDriver: false },
      calendar2026,
      promos,
      'SUMMER10',
    )
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.days).toBe(3)
    expect(result.baseRental).toBe(570)   // 190 × 3
    expect(result.addonsTotal).toBe(30)   // child seat
    expect(result.deliveryFee).toBe(80)   // 30 + 50
    expect(result.subTotal).toBe(680)
    expect(result.discountPercent).toBe(10)
    expect(result.discountAmount).toBeCloseTo(68)
    expect(result.finalTotal).toBe(612)
    expect(result.amountSen).toBe(61200)
  })
})
