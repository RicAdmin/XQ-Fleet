import { describe, expect, it } from 'vitest'

import {
  fleetBookingCapacity,
  isFleetAtCapacity,
  usesSingleUnitCarStatus,
} from '#/lib/fleet-capacity'

describe('fleetBookingCapacity', () => {
  it('sums numberOfUnits and overbookUnits', () => {
    expect(fleetBookingCapacity({ numberOfUnits: 10, overbookUnits: 5 })).toBe(15)
  })

  it('treats numberOfUnits below 1 as 1', () => {
    expect(fleetBookingCapacity({ numberOfUnits: 0, overbookUnits: 2 })).toBe(3)
  })

  it('defaults overbook to zero', () => {
    expect(fleetBookingCapacity({ numberOfUnits: 2, overbookUnits: -1 })).toBe(2)
  })
})

describe('isFleetAtCapacity', () => {
  it('allows bookings below capacity', () => {
    expect(isFleetAtCapacity(9, { numberOfUnits: 10, overbookUnits: 0 })).toBe(false)
  })

  it('blocks at exact capacity', () => {
    expect(isFleetAtCapacity(10, { numberOfUnits: 10, overbookUnits: 0 })).toBe(true)
  })

  it('includes overbook headroom', () => {
    expect(isFleetAtCapacity(11, { numberOfUnits: 10, overbookUnits: 2 })).toBe(false)
    expect(isFleetAtCapacity(12, { numberOfUnits: 10, overbookUnits: 2 })).toBe(true)
  })
})

describe('usesSingleUnitCarStatus', () => {
  it('is true only for single-slot models', () => {
    expect(usesSingleUnitCarStatus({ numberOfUnits: 1, overbookUnits: 0 })).toBe(true)
    expect(usesSingleUnitCarStatus({ numberOfUnits: 2, overbookUnits: 0 })).toBe(false)
    expect(usesSingleUnitCarStatus({ numberOfUnits: 1, overbookUnits: 1 })).toBe(false)
  })
})
