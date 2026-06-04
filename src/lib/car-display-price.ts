import {
  calculateBaseRental,
  getRentalDays,
  type CarPricing,
  type SeasonRange,
} from '#/lib/pricing-logic'

export type CarSeasonRateFields = {
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
}

function carPricingFromSeasonRates(car: CarSeasonRateFields): CarPricing {
  return {
    status: 'Active',
    availableForBooking: true,
    priceLowSeasonSen: car.priceLowSeasonSen,
    pricePeakSeasonSen: car.pricePeakSeasonSen,
    priceSuperPeakSeasonSen: car.priceSuperPeakSeasonSen,
    extHourLowSen: 0,
    extHourPeakAndSuperPeakSen: 0,
    deliveryFeeAirportSen: 0,
    deliveryFeeJettySen: 0,
    deliveryFeeHotelSen: 0,
    minRentalDays: 1,
    maxRentalDays: 30,
  }
}

/** Average daily rate (sen) for a trip using season calendar + season columns. */
export function averageDailyRateSenForTrip(
  car: CarSeasonRateFields,
  pickDate: Date,
  returnDate: Date,
  calendar: SeasonRange[],
): number {
  const days = getRentalDays(pickDate, returnDate, calendar)
  if (days.length === 0) return 0
  const baseRentalRm = calculateBaseRental(days, carPricingFromSeasonRates(car))
  return Math.round((baseRentalRm / days.length) * 100)
}

/** True when season calendar pricing should drive listing/detail display. */
export function usesSeasonDisplayPricing(
  pickDate: Date | null | undefined,
  returnDate: Date | null | undefined,
  calendar: SeasonRange[],
): boolean {
  return Boolean(pickDate && returnDate && calendar.length > 0)
}

/** Listing/card price: season average when dates are set, otherwise marketing daily rate. */
export function displayDailyRateSen(
  car: { dailyRateSen: number } & CarSeasonRateFields,
  pickDate: Date | null | undefined,
  returnDate: Date | null | undefined,
  calendar: SeasonRange[],
): number {
  if (!pickDate || !returnDate || calendar.length === 0) {
    return car.dailyRateSen
  }
  const seasonSen = averageDailyRateSenForTrip(car, pickDate, returnDate, calendar)
  return seasonSen > 0 ? seasonSen : car.dailyRateSen
}

/** Total base rental (sen) for selected trip dates, before extras and discounts. */
export function tripBaseRentalSen(
  car: CarSeasonRateFields,
  pickDate: Date,
  returnDate: Date,
  calendar: SeasonRange[],
): number {
  const days = getRentalDays(pickDate, returnDate, calendar)
  if (days.length === 0) return 0
  return Math.round(calculateBaseRental(days, carPricingFromSeasonRates(car)) * 100)
}
