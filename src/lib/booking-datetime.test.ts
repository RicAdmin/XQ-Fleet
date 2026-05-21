import { describe, expect, it } from 'vitest'

import { formatTripDuration, tripDurationParts } from './booking-datetime'

const d = (ymd: string) => new Date(`${ymd}T12:00:00`)

describe('tripDurationParts', () => {
  it('rounds trips under 24 hours up to 1 day', () => {
    expect(
      tripDurationParts(d('2026-05-21'), '10:00 AM', d('2026-05-22'), '8:00 AM'),
    ).toEqual({ days: 1, hours: 0 })
  })

  it('shows extra hours only once the trip reaches 24 hours', () => {
    expect(
      tripDurationParts(d('2026-05-21'), '10:00 AM', d('2026-05-22'), '2:00 PM'),
    ).toEqual({ days: 1, hours: 4 })
  })

  it('handles exact 24-hour trips as 1 day', () => {
    expect(
      tripDurationParts(d('2026-05-21'), '10:00 AM', d('2026-05-22'), '10:00 AM'),
    ).toEqual({ days: 1, hours: 0 })
  })
})

describe('formatTripDuration', () => {
  it('never shows sub-24-hour durations', () => {
    expect(formatTripDuration(d('2026-05-21'), '6:00 PM', d('2026-05-22'), '6:00 AM')).toBe(
      '1 day',
    )
  })

  it('shows days and hours for longer trips', () => {
    expect(formatTripDuration(d('2026-05-21'), '10:00 AM', d('2026-05-23'), '6:00 PM')).toBe(
      '2 days · 8 hrs',
    )
  })
})
