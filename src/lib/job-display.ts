import type { RentalType, RentalFulfillmentSource } from '#/db/schema'
import type { RentalListRow } from '#/lib/rental-functions'
import {
  isPickupOverdue,
  isReturnOverdue,
} from '#/components/admin/operations-queue-utils'
import { makeBookingRef, rentalDays } from '#/emails/email-helpers'

export const JOB_SOURCES = ['in-house', 'web', 'sales-agent'] as const
export type JobSource = (typeof JOB_SOURCES)[number]

export const JOB_SOURCE_LABELS: Record<JobSource, string> = {
  'in-house': 'In-House',
  web: 'Web',
  'sales-agent': 'Sales Agent',
}

export type JobSourceInput = Pick<
  RentalListRow,
  | 'type'
  | 'affiliateRefCode'
  | 'affiliateAttributionId'
  | 'refferqRefCode'
>

export function hasSalesAgentAttribution(row: {
  affiliateRefCode?: string | null
  affiliateAttributionId?: string | null
  refferqRefCode?: string | null
}): boolean {
  if (row.affiliateAttributionId) return true
  if (row.affiliateRefCode?.trim()) return true
  if (row.refferqRefCode?.trim()) return true
  return false
}

export function resolveJobSource(row: JobSourceInput): JobSource {
  if (row.type === 'walk-in') return 'in-house'
  if (hasSalesAgentAttribution(row)) return 'sales-agent'
  return 'web'
}

/** Staff-created job types shown in create/edit forms (Sales Agent is derived from affiliate data). */
export function formatJobType(type: RentalType): string {
  return type === 'walk-in' ? JOB_SOURCE_LABELS['in-house'] : JOB_SOURCE_LABELS.web
}

export function formatJobSource(row: JobSourceInput): string {
  return JOB_SOURCE_LABELS[resolveJobSource(row)]
}

export function formatFulfillmentLabel(
  source: RentalFulfillmentSource | null | undefined,
): string {
  if (source === 'owned') return 'Owned plate'
  if (source === 'partner') return 'Partner'
  return 'Plate TBC'
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
  if (rental.status === 'pending' || rental.status === 'confirmed')
    return isPickupOverdue(rental)
  if (rental.status === 'active') return isReturnOverdue(rental)
  return false
}
