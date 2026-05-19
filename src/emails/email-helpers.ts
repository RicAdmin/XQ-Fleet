/** Converts integer sen to "RM X.XX" display string. */
export function formatRM(sen: number): string {
  return `RM ${(sen / 100).toFixed(2)}`
}

/** Formats a Date to "Tue, 19 May 2026" using Malaysia timezone. */
export function formatBookingDate(date: Date): string {
  return date.toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

/** Formats a Date to "14 May 2026". */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

/** Converts "08:00:00" → "8:00 AM", "13:30:00" → "1:30 PM". */
export function formatBookingTime(time: string | null): string {
  if (!time) return '–'
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return time
  const ampm = h < 12 ? 'AM' : 'PM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

/** Computes rental duration in whole days. */
export function rentalDays(startDate: Date, endDate: Date): number {
  const ms = endDate.getTime() - startDate.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

/** Generates short booking reference from rental UUID: e.g. "A1B2-C3D4". */
export function makeBookingRef(rentalId: string): string {
  const hex = rentalId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`
}

export function categoryDisplayName(category: string): string {
  const labels: Record<string, string> = {
    economy: 'Economy',
    mpv: 'MPV',
    suv: 'SUV',
    other: '',
  }
  return labels[category] ?? ''
}
