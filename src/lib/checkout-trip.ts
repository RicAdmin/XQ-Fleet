import {
  cloneBooking,
  defaultBooking,
  hasPickupReturnDetails,
  hasTripDates,
  sanitizeBookingDates,
  type BookingState,
} from '#/lib/booking-state'
import { parseLocalYmd, toLocalYmd } from '#/lib/booking-datetime'
import { loadTripSearch } from '#/lib/trip-search-storage'

export type CheckoutTripSearch = {
  startDate?: string
  endDate?: string
  from?: string
  retLoc?: string
  tripType?: BookingState['tripType']
  pickTime?: string
  retTime?: string
  adults?: string
  children?: string
}

function optionalSearchString(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  return String(value)
}

/** TanStack Router may parse ?adults=2 as a number — coerce before use. */
export function parseCheckoutSearch(search: Record<string, unknown>): CheckoutTripSearch {
  const tripType = search.tripType
  return {
    startDate: typeof search.startDate === 'string' ? search.startDate : undefined,
    endDate: typeof search.endDate === 'string' ? search.endDate : undefined,
    from: typeof search.from === 'string' ? search.from : undefined,
    retLoc: typeof search.retLoc === 'string' ? search.retLoc : undefined,
    tripType: tripType === 'round' || tripType === 'oneway' ? tripType : undefined,
    pickTime: optionalSearchString(search.pickTime),
    retTime: optionalSearchString(search.retTime),
    adults: optionalSearchString(search.adults),
    children: optionalSearchString(search.children),
  }
}

export function checkoutSearchFromBooking(booking: BookingState): CheckoutTripSearch {
  return {
    startDate: toLocalYmd(booking.pickDate),
    endDate: toLocalYmd(booking.retDate),
    from: booking.from,
    retLoc: booking.retLoc,
    tripType: booking.tripType,
    pickTime: booking.pickTime,
    retTime: booking.retTime,
    adults: String(booking.adults),
    children: String(booking.children),
  }
}

/** Resolve checkout trip from URL search params with sessionStorage fallback. */
export function resolveCheckoutBooking(search: CheckoutTripSearch): BookingState {
  const stored = loadTripSearch()
  const fallback = stored?.searchCriteria ?? stored?.booking ?? null
  const base = fallback ? cloneBooking(fallback) : defaultBooking()

  const adults = search.adults != null ? Number.parseInt(search.adults, 10) : base.adults
  const children = search.children != null ? Number.parseInt(search.children, 10) : base.children

  return sanitizeBookingDates({
    from: search.from ?? base.from,
    retLoc: search.retLoc ?? base.retLoc,
    tripType: search.tripType ?? base.tripType,
    pickDate: search.startDate ? parseLocalYmd(search.startDate) : base.pickDate,
    retDate: search.endDate ? parseLocalYmd(search.endDate) : base.retDate,
    pickTime: search.pickTime !== undefined ? search.pickTime : base.pickTime,
    retTime: search.retTime !== undefined ? search.retTime : base.retTime,
    adults: Number.isFinite(adults) ? Math.min(9, Math.max(1, adults)) : base.adults,
    children: Number.isFinite(children) ? Math.min(8, Math.max(0, children)) : base.children,
  })
}

/** Dates and times present — enough to preview pricing. */
export function bookingHasCompleteTrip(booking: BookingState): boolean {
  return hasTripDates(booking)
}

/** Dates, times, and pickup/return locations — required before payment. */
export function bookingHasPickupReturnDetails(booking: BookingState): boolean {
  return hasPickupReturnDetails(booking)
}
