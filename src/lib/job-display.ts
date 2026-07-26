import type { RentalType } from '#/db/schema'
import type { RentalListRow } from '#/lib/rental-functions'
import {
  isPickupOverdue,
  isReturnOverdue,
} from '#/components/admin/operations-queue-utils'
import { makeBookingRef, rentalDays } from '#/emails/email-helpers'

export function formatJobType(type: RentalType): string {
  return type === 'walk-in' ? 'In House' : 'Online booking'
}

/** In-house CS jobs show as "CS · {staff name}"; portal bookings as "Online". */
export function formatJobSource(
  type: RentalType,
  createdByName?: string | null,
): string {
  if (type === 'walk-in') {
    const name = createdByName?.trim()
    return name ? `CS · ${name}` : 'CS'
  }
  return 'Online'
}

export function jobBookingRef(rentalId: string): string {
  return makeBookingRef(rentalId)
}

export function jobDurationDays(startDate: Date, endDate: Date): number {
  return Math.max(1, rentalDays(startDate, endDate))
}

export function jobExtraHours(extraHoursDecimal: string | null | undefined): number {
  if (!extraHoursDecimal) return 0
  const value = Number(extraHoursDecimal)
  return Number.isFinite(value) && value > 0 ? value : 0
}

/** Compact duration label, e.g. "2D + 3H" or "2D". */
export function formatJobDurationLabel(
  startDate: Date,
  endDate: Date,
  extraHoursDecimal?: string | null,
): string {
  const days = jobDurationDays(startDate, endDate)
  const hours = jobExtraHours(extraHoursDecimal)
  const dayPart = `${days}D`
  if (hours <= 0) return dayPart
  const hourLabel = Number.isInteger(hours) ? String(hours) : hours.toFixed(1)
  return `${dayPart} + ${hourLabel}H`
}

export function toTimeHms(time: string): string {
  const trimmed = time.trim()
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`
  return trimmed
}

/** Convert stored HH:MM:SS (or HH:MM) to HTML time input value. */
export function toTimeInputValue(time: string | null | undefined): string {
  if (!time) return '09:00'
  const trimmed = time.trim()
  if (/^\d{2}:\d{2}/.test(trimmed)) return trimmed.slice(0, 5)
  return '09:00'
}

export function isJobOverdue(rental: RentalListRow): boolean {
  if (rental.status === 'pending') return isPickupOverdue(rental)
  if (rental.status === 'active') return isReturnOverdue(rental)
  return false
}
