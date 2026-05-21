/** Calendar date at local midnight. */
export function startOfLocalDay(date: Date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Earliest bookable pickup — tomorrow (today and past dates are not allowed). */
export function earliestPickupDate(from: Date = new Date()): Date {
  return addCalendarDays(startOfLocalDay(from), 1)
}

export function isAllowedPickupDate(date: Date | null, from: Date = new Date()): boolean {
  if (!date) return false
  return startOfLocalDay(date) >= earliestPickupDate(from)
}

export function isAllowedReturnDate(pickDate: Date | null, retDate: Date | null): boolean {
  if (!pickDate || !retDate) return false
  if (!isAllowedPickupDate(pickDate)) return false
  const earliestReturn = addCalendarDays(startOfLocalDay(pickDate), 1)
  return startOfLocalDay(retDate) >= earliestReturn
}

/** Serialize a local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function toLocalYmd(date: Date | null | undefined): string | undefined {
  if (!date) return undefined
  const d = startOfLocalDay(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseLocalYmd(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Calendar date at local midnight, plus N days. */
export function addCalendarDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}

/** Parse "10:30 AM" / "16:30" / "10:30:00" to HH:MM:SS for Date.setHours. */
export function bookingTimeToHms(time: string): string {
  const t = time.trim()
  if (!t) return '08:00:00'
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2]
    const period = m[3].toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${min}:00`
  }
  return '08:00:00'
}

export function bookingDateTime(date: Date | null, time: string): Date | null {
  if (!date || !time.trim()) return null
  const [h, m, s] = bookingTimeToHms(time).split(':').map(Number)
  const dt = new Date(date)
  dt.setHours(h, m, s ?? 0, 0)
  return dt
}

/** Elapsed rental window from pickup to return (date + time). */
export function tripDurationParts(
  pickDate: Date | null,
  pickTime: string,
  retDate: Date | null,
  retTime: string,
): { days: number; hours: number } | null {
  const start = bookingDateTime(pickDate, pickTime)
  const end = bookingDateTime(retDate, retTime)
  if (!start || !end) return null
  const ms = end.getTime() - start.getTime()
  if (ms <= 0) return null
  const totalHours = Math.floor(ms / 3_600_000)
  return { days: Math.floor(totalHours / 24), hours: totalHours % 24 }
}

/** Human label for the price-box duration badge, e.g. "3 days · 18 hrs". */
export function formatTripDuration(
  pickDate: Date | null,
  pickTime: string,
  retDate: Date | null,
  retTime: string,
): string {
  const parts = tripDurationParts(pickDate, pickTime, retDate, retTime)
  if (!parts) return '—'
  const { days, hours } = parts
  if (days === 0 && hours === 0) return '< 1 hr'
  const labels: string[] = []
  if (days > 0) labels.push(`${days} day${days !== 1 ? 's' : ''}`)
  if (hours > 0) labels.push(`${hours} hr${hours !== 1 ? 's' : ''}`)
  return labels.join(' · ')
}

/** Hours beyond billable full-day blocks (pickup time + N × 24h). */
export function tripExtraHours(
  pickDate: Date | null,
  pickTime: string,
  retDate: Date | null,
  retTime: string,
  billableDays: number,
): number {
  if (!pickDate || !retDate || billableDays <= 0) return 0
  const start = bookingDateTime(pickDate, pickTime)
  const end = bookingDateTime(retDate, retTime)
  if (!start || !end) return 0
  const scheduledEnd = new Date(start.getTime() + billableDays * 24 * 60 * 60 * 1000)
  const extraMs = end.getTime() - scheduledEnd.getTime()
  return extraMs > 0 ? extraMs / 3_600_000 : 0
}

export function formatExtraHours(hours: number): string {
  if (hours <= 0) return ''
  const rounded = Math.round(hours * 10) / 10
  return `${rounded} hr${rounded !== 1 ? 's' : ''}`
}

/** Checkout estimate — mirrors pricing full-day cap at 6+ extra hours. */
export function estimateExtraHoursCharge(
  hours: number,
  hourlyRateSen: number | null | undefined,
  dailyRateSen: number | null | undefined,
): number {
  if (hours <= 0) return 0
  const hourly = (hourlyRateSen ?? 0) / 100
  const daily = (dailyRateSen ?? 0) / 100
  if (hourly <= 0 && daily <= 0) return 0
  if (hours >= 6) return Math.ceil(hours / 24) * daily
  return Math.round(hours * hourly)
}
