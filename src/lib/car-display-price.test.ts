import { describe, expect, it } from 'vitest'

import {
  averageDailyRateSenForTrip,
  displayDailyRateSen,
  usesSeasonDisplayPricing,
} from '#/lib/car-display-price'
import type { SeasonRange } from '#/lib/pricing-logic'

const viosRates = {
  dailyRateSen: 10000,
  priceLowSeasonSen: 10000,
  pricePeakSeasonSen: 16000,
  priceSuperPeakSeasonSen: 19000,
}

const calendar: SeasonRange[] = [
  {
    fromDate: new Date(2026, 0, 1),
    toDate: new Date(2026, 11, 31),
    seasonType: 'Peak',
  },
]

describe('displayDailyRateSen', () => {
  it('uses dailyRateSen when no dates are selected', () => {
    expect(displayDailyRateSen(viosRates, null, null, calendar)).toBe(10000)
  })

  it('falls back to dailyRateSen when calendar is empty', () => {
    const pick = new Date(2026, 5, 10)
    const ret = new Date(2026, 5, 11)
    expect(displayDailyRateSen(viosRates, pick, ret, [])).toBe(10000)
    expect(usesSeasonDisplayPricing(pick, ret, [])).toBe(false)
  })

  it('uses season pricing when dates are selected', () => {
    const pick = new Date(2026, 5, 10)
    const ret = new Date(2026, 5, 11)
    expect(averageDailyRateSenForTrip(viosRates, pick, ret, calendar)).toBe(16000)
    expect(displayDailyRateSen(viosRates, pick, ret, calendar)).toBe(16000)
    expect(usesSeasonDisplayPricing(pick, ret, calendar)).toBe(true)
  })

  it('averages mixed season days', () => {
    const mixedCalendar: SeasonRange[] = [
      {
        fromDate: new Date(2026, 5, 1),
        toDate: new Date(2026, 5, 9),
        seasonType: 'Low',
      },
      {
        fromDate: new Date(2026, 5, 10),
        toDate: new Date(2026, 5, 20),
        seasonType: 'Peak',
      },
    ]
    const pick = new Date(2026, 5, 9)
    const ret = new Date(2026, 5, 11)
    expect(averageDailyRateSenForTrip(viosRates, pick, ret, mixedCalendar)).toBe(13000)
  })
})
