import { describe, expect, it } from 'vitest'

import { computeCommissionSen } from './affiliate-functions'

describe('computeCommissionSen', () => {
  describe('percent commission', () => {
    it('returns whole-percent share of paid amount, floored', () => {
      // 10% of RM 1000.00 = RM 100.00
      expect(computeCommissionSen('percent', 10, 100_000)).toBe(10_000)
    })

    it('floors fractional sen', () => {
      // 7% of 199 sen = 13.93 sen → floored to 13
      expect(computeCommissionSen('percent', 7, 199)).toBe(13)
    })

    it('treats negative percent as 0', () => {
      expect(computeCommissionSen('percent', -5, 100_000)).toBe(0)
    })

    it('clamps percent above 100', () => {
      expect(computeCommissionSen('percent', 250, 100_000)).toBe(100_000)
    })

    it('returns 0 when paid amount is 0', () => {
      expect(computeCommissionSen('percent', 10, 0)).toBe(0)
    })

    it('returns 0 when paid amount is negative', () => {
      expect(computeCommissionSen('percent', 10, -500)).toBe(0)
    })
  })

  describe('fixed commission', () => {
    it('returns the fixed value when below paid amount', () => {
      expect(computeCommissionSen('fixed', 5_000, 100_000)).toBe(5_000)
    })

    it('caps at the paid amount', () => {
      // Affiliate has RM 50 fixed but booking only paid RM 20 — cap at 20.
      expect(computeCommissionSen('fixed', 5_000, 2_000)).toBe(2_000)
    })

    it('returns 0 for negative commission value', () => {
      expect(computeCommissionSen('fixed', -100, 100_000)).toBe(0)
    })

    it('returns 0 when paid amount is 0', () => {
      expect(computeCommissionSen('fixed', 5_000, 0)).toBe(0)
    })
  })
})
