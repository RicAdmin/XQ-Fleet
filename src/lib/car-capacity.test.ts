import { describe, expect, it } from 'vitest'

import {
  ownedUnitCountFromSiblings,
  sumActivePartnerOverbook,
} from '#/lib/car-capacity'
import { fleetBookingCapacity } from '#/lib/fleet-capacity'

describe('sumActivePartnerOverbook', () => {
  it('sums only active partner maxUnits', () => {
    expect(
      sumActivePartnerOverbook([
        { maxUnits: 3, isActive: true },
        { maxUnits: 5, isActive: false },
        { maxUnits: 2, isActive: true },
      ]),
    ).toBe(5)
  })

  it('returns 0 when empty', () => {
    expect(sumActivePartnerOverbook([])).toBe(0)
  })

  it('floors invalid maxUnits to 0 contribution', () => {
    expect(
      sumActivePartnerOverbook([
        { maxUnits: Number.NaN, isActive: true },
        { maxUnits: -2, isActive: true },
        { maxUnits: 4, isActive: true },
      ]),
    ).toBe(4)
  })
})

describe('ownedUnitCountFromSiblings', () => {
  it('uses sibling count when at least one plate exists', () => {
    expect(ownedUnitCountFromSiblings(3)).toBe(3)
  })

  it('floors to 1 when no owned siblings are found', () => {
    expect(ownedUnitCountFromSiblings(0)).toBe(1)
  })
})

describe('capacity board max concurrent', () => {
  it('matches fleetBookingCapacity with derived owned + partner totals', () => {
    const ownedCount = ownedUnitCountFromSiblings(2)
    const partnerOverbookTotal = sumActivePartnerOverbook([
      { maxUnits: 4, isActive: true },
      { maxUnits: 1, isActive: false },
    ])
    expect(
      fleetBookingCapacity({
        numberOfUnits: ownedCount,
        overbookUnits: partnerOverbookTotal,
      }),
    ).toBe(6)
  })
})
