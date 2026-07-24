import type { BookingState } from '#/lib/booking-state'
import { sanitizeBookingDates } from '#/lib/booking-state'

const STORAGE_KEY = 'cxq-trip-search'

type StoredBooking = {
  from: string
  retLoc: string
  tripType: BookingState['tripType']
  pickDate: string | null
  retDate: string | null
  pickTime: string
  retTime: string
  adults: number
  children: number
}

type StoredTripSearch = {
  booking: StoredBooking
  searchCriteria: StoredBooking | null
}

import { parseLocalYmd, toLocalYmd } from '#/lib/booking-datetime'

function serialize(booking: BookingState): StoredBooking {
  return {
    from: booking.from,
    retLoc: booking.retLoc,
    tripType: booking.tripType,
    pickDate: toLocalYmd(booking.pickDate) ?? null,
    retDate: toLocalYmd(booking.retDate) ?? null,
    pickTime: booking.pickTime,
    retTime: booking.retTime,
    adults: booking.adults,
    children: booking.children,
  }
}

function deserialize(stored: StoredBooking): BookingState {
  return {
    from: stored.from,
    retLoc: stored.retLoc,
    tripType: stored.tripType,
    pickDate: parseLocalYmd(stored.pickDate),
    retDate: parseLocalYmd(stored.retDate),
    pickTime: stored.pickTime,
    retTime: stored.retTime,
    adults: stored.adults,
    children: stored.children,
  }
}

export function loadTripSearch(): { booking: BookingState; searchCriteria: BookingState | null } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTripSearch
    if (!parsed?.booking) return null
    return {
      booking: sanitizeBookingDates(deserialize(parsed.booking)),
      searchCriteria: parsed.searchCriteria
        ? sanitizeBookingDates(deserialize(parsed.searchCriteria))
        : null,
    }
  } catch {
    return null
  }
}

export function saveTripSearch(booking: BookingState, searchCriteria: BookingState | null): void {
  if (typeof window === 'undefined') return
  try {
    const payload: StoredTripSearch = {
      booking: serialize(sanitizeBookingDates(booking)),
      searchCriteria: searchCriteria ? serialize(sanitizeBookingDates(searchCriteria)) : null,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / privacy mode errors
  }
}
