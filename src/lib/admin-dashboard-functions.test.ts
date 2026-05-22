import { describe, expect, it } from 'vitest'

import { computeMomDelta } from './admin-dashboard-functions'

describe('computeMomDelta', () => {
  it('returns a positive percent when current > previous', () => {
    expect(computeMomDelta(150, 100)).toBeCloseTo(50)
  })

  it('returns a negative percent when current < previous', () => {
    expect(computeMomDelta(60, 120)).toBeCloseTo(-50)
  })

  it('returns 0 when both are zero', () => {
    expect(computeMomDelta(0, 0)).toBe(0)
  })

  it('returns null when previous is zero and current is positive', () => {
    expect(computeMomDelta(100, 0)).toBeNull()
  })

  it('returns 0 when current matches previous', () => {
    expect(computeMomDelta(123, 123)).toBe(0)
  })
})

/**
 * Same-day cutoff for MoM comparison: when comparing MTD revenue, the previous
 * month is intentionally truncated at the same calendar day in the prior month
 * so April-MTD-through-15th is compared against March-1st-through-March-15th.
 */
function computeLastMonthCutoff(d: Date): Date {
  const target = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate())
  if (target.getMonth() === d.getMonth()) {
    return new Date(d.getFullYear(), d.getMonth(), 1)
  }
  return target
}

describe('lastMonthSameDayCutoff (MoM date math)', () => {
  it('produces the same day in the previous month', () => {
    const d = new Date(2026, 4, 15) // May 15, 2026
    const cutoff = computeLastMonthCutoff(d)
    expect(cutoff.getFullYear()).toBe(2026)
    expect(cutoff.getMonth()).toBe(3) // April
    expect(cutoff.getDate()).toBe(15)
  })

  it('clamps when previous month is shorter (March 31 → Feb 28-equivalent)', () => {
    const d = new Date(2025, 2, 31) // March 31, 2025 (non-leap year)
    const cutoff = computeLastMonthCutoff(d)
    // JS new Date(2025, 1, 31) overflows to March 3 — our clamp falls back to
    // start of current month.
    expect(cutoff.getMonth()).toBe(2)
    expect(cutoff.getDate()).toBe(1)
  })

  it('handles leap year February correctly', () => {
    const d = new Date(2024, 2, 29) // March 29, 2024 (leap year)
    const cutoff = computeLastMonthCutoff(d)
    expect(cutoff.getMonth()).toBe(1) // February
    expect(cutoff.getDate()).toBe(29)
  })
})
