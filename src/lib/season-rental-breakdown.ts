import type { CarSeasonRateFields } from '#/lib/car-display-price'
import type { DayEntry, SeasonType } from '#/lib/pricing-logic'

export type SeasonRentalLine = {
  seasonType: SeasonType
  days: number
  dailyRateRm: number
  subtotalRm: number
  dateLabel: string
}

function seasonRateSen(seasonType: SeasonType, car: CarSeasonRateFields): number {
  switch (seasonType) {
    case 'Low':
      return car.priceLowSeasonSen
    case 'Peak':
      return car.pricePeakSeasonSen
    case 'Super Peak':
      return car.priceSuperPeakSeasonSen
  }
}

/** Coerce server-serialized breakdown dates back to Date objects. */
export function normalizeDayEntries(
  breakdown: ReadonlyArray<{ date: Date | string; seasonType: SeasonType }>,
): DayEntry[] {
  return breakdown.map((entry) => ({
    date: entry.date instanceof Date ? entry.date : new Date(entry.date),
    seasonType: entry.seasonType,
  }))
}

/** Format a consecutive run of rental days for checkout display (e.g. "05–06 Jun" or "07 Jun"). */
export function formatSeasonDateRange(dates: Date[], locale: string): string {
  if (dates.length === 0) return ''
  if (dates.length === 1) {
    return dates[0].toLocaleDateString(locale, { day: '2-digit', month: 'short' })
  }

  const first = dates[0]
  const last = dates[dates.length - 1]
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    const month = first.toLocaleDateString(locale, { month: 'short' })
    const startDay = String(first.getDate()).padStart(2, '0')
    const endDay = String(last.getDate()).padStart(2, '0')
    return `${startDay}–${endDay} ${month}`
  }

  const start = first.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
  const end = last.toLocaleDateString(locale, { day: '2-digit', month: 'short' })
  return `${start} – ${end}`
}

function groupConsecutiveSeasonRuns(days: DayEntry[]): DayEntry[][] {
  if (days.length === 0) return []

  const runs: DayEntry[][] = [[days[0]]]
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1]
    const day = days[i]
    if (day.seasonType === prev.seasonType) {
      runs[runs.length - 1].push(day)
    } else {
      runs.push([day])
    }
  }
  return runs
}

/** Group charged rental days into consecutive season lines for checkout breakdown. */
export function buildSeasonRentalLines(
  breakdown: ReadonlyArray<{ date: Date | string; seasonType: SeasonType }>,
  car: CarSeasonRateFields,
  locale: string,
): SeasonRentalLine[] {
  const days = normalizeDayEntries(breakdown)
  if (days.length === 0) return []

  return groupConsecutiveSeasonRuns(days).map((run) => {
    const seasonType = run[0].seasonType
    const dailyRateSen = seasonRateSen(seasonType, car)
    const dailyRateRm = dailyRateSen / 100
    const days = run.length
    return {
      seasonType,
      days,
      dailyRateRm,
      subtotalRm: (dailyRateSen * days) / 100,
      dateLabel: formatSeasonDateRange(
        run.map((d) => d.date),
        locale,
      ),
    }
  })
}
