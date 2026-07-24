import {
  isAllowedPickupDate,
  isAllowedReturnDate,
} from '#/lib/booking-datetime'

export type TripType = 'round' | 'oneway'

export type BookingState = {
  from: string
  retLoc: string
  tripType: TripType
  pickDate: Date | null
  retDate: Date | null
  pickTime: string
  retTime: string
  adults: number
  children: number
}

/** Pickup/return dates and times chosen; pickup must be tomorrow or later. */
export function hasTripDates(
  booking: Pick<BookingState, 'pickDate' | 'retDate' | 'pickTime' | 'retTime'>,
): boolean {
  return (
    isAllowedReturnDate(booking.pickDate, booking.retDate) &&
    Boolean(booking.pickTime.trim()) &&
    Boolean(booking.retTime.trim())
  )
}

export function cloneBooking(booking: BookingState): BookingState {
  return {
    ...booking,
    pickDate: booking.pickDate ? new Date(booking.pickDate.getTime()) : null,
    retDate: booking.retDate ? new Date(booking.retDate.getTime()) : null,
  }
}

export function sanitizeBookingDates(booking: BookingState): BookingState {
  const b = cloneBooking(booking)
  if (!isAllowedPickupDate(b.pickDate)) {
    b.pickDate = null
    b.retDate = null
    b.pickTime = ''
    b.retTime = ''
    return b
  }
  if (!isAllowedReturnDate(b.pickDate, b.retDate)) {
    b.retDate = null
    b.retTime = ''
  }
  return b
}

export function defaultBooking(): BookingState {
  const d1 = new Date()
  d1.setDate(d1.getDate() + 5)
  d1.setHours(0, 0, 0, 0)
  const d2 = new Date()
  d2.setDate(d2.getDate() + 9)
  d2.setHours(0, 0, 0, 0)
  return {
    from: 'Langkawi Intl Airport · Door 3',
    retLoc: 'Langkawi Intl Airport · Door 3',
    tripType: 'round',
    pickDate: d1,
    retDate: d2,
    pickTime: '',
    retTime: '',
    adults: 2,
    children: 0,
  }
}

export function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return 0
  const ms = b.getTime() - a.getTime()
  return ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 0
}

/** Pickup / return line for price box and results — matches active search criteria. */
export function bookingLocationSummary(booking: BookingState, pickupTbc: string): string {
  const pickup = booking.from.trim() || pickupTbc
  if (booking.tripType === 'round') {
    return pickup
  }
  const ret = booking.retLoc.trim()
  if (ret && ret !== pickup) {
    return `${pickup} → ${ret}`
  }
  return pickup
}
