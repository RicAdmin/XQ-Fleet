import {
  cloneBooking,
  defaultBooking,
  hasTripDates,
  sanitizeBookingDates,
  type BookingState,
} from '#/components/landing/CarDetailDialog'
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

export function bookingHasCompleteTrip(booking: BookingState): boolean {
  return hasTripDates(booking)
}
