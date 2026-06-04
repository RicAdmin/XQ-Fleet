import { describe, expect, it } from 'vitest'

import { buildSeasonRentalLines, formatSeasonDateRange } from './season-rental-breakdown'
import type { SeasonType } from './pricing-logic'

const carRates = {
  priceLowSeasonSen: 10000,
  pricePeakSeasonSen: 15000,
  priceSuperPeakSeasonSen: 20000,
}

function day(ymd: string, seasonType: SeasonType) {
  const [y, m, d] = ymd.split('-').map(Number)
  return { date: new Date(y, m - 1, d), seasonType }
}

describe('formatSeasonDateRange', () => {
  it('formats a single day', () => {
    expect(formatSeasonDateRange([new Date(2026, 5, 7)], 'en-GB')).toBe('07 Jun')
  })

  it('formats a range within the same month', () => {
    expect(
      formatSeasonDateRange([new Date(2026, 5, 5), new Date(2026, 5, 6)], 'en-GB'),
    ).toBe('05–06 Jun')
  })
})

describe('buildSeasonRentalLines', () => {
  it('groups consecutive days by season like the checkout mock', () => {
    const lines = buildSeasonRentalLines(
      [day('2026-06-05', 'Low'), day('2026-06-06', 'Low'), day('2026-06-07', 'Peak')],
      carRates,
      'en-GB',
    )

    expect(lines).toHaveLength(2)
    expect(lines[0]).toMatchObject({
      seasonType: 'Low',
      days: 2,
      dailyRateRm: 100,
      subtotalRm: 200,
      dateLabel: '05–06 Jun',
    })
    expect(lines[1]).toMatchObject({
      seasonType: 'Peak',
      days: 1,
      dailyRateRm: 150,
      subtotalRm: 150,
      dateLabel: '07 Jun',
    })
  })

  it('coerces ISO date strings from the pricing preview', () => {
    const lines = buildSeasonRentalLines(
      [{ date: '2026-06-07T00:00:00.000Z', seasonType: 'Peak' }],
      carRates,
      'en-GB',
    )
    expect(lines[0].subtotalRm).toBe(150)
  })
})
