import { describe, expect, it } from 'vitest'

import {
  fulfillmentForKnownPlate,
  makePartnerTempLabel,
  makeTempHoldLabel,
  pickFreeOwnedUnitId,
  resolveDisplayPlate,
} from '#/lib/rental-fulfillment'

describe('resolveDisplayPlate', () => {
  it('prefers assigned plate over temp and listing', () => {
    expect(
      resolveDisplayPlate({
        assignedPlateNumber: 'KV5530E',
        tempPlateLabel: 'HOLD-ABCD-EF01',
        listingPlateNumber: 'LISTING1',
      }),
    ).toBe('KV5530E')
  })

  it('uses temp hold when no assigned plate', () => {
    expect(
      resolveDisplayPlate({
        assignedPlateNumber: null,
        tempPlateLabel: 'HOLD-ABCD-EF01',
        listingPlateNumber: 'LISTING1',
      }),
    ).toBe('HOLD-ABCD-EF01')
  })

  it('falls back to listing plate then TBC', () => {
    expect(
      resolveDisplayPlate({
        listingPlateNumber: 'LISTING1',
      }),
    ).toBe('LISTING1')
    expect(resolveDisplayPlate({})).toBe('TBC')
  })
})

describe('temp labels', () => {
  it('builds HOLD label from rental id', () => {
    expect(makeTempHoldLabel('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'HOLD-A1B2-C3D4',
    )
  })

  it('builds partner temp label', () => {
    expect(makePartnerTempLabel('lar', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'TEMP-LAR-A1B2C3D4',
    )
  })
})

describe('pickFreeOwnedUnitId', () => {
  it('returns first unclaimed owned unit', () => {
    expect(pickFreeOwnedUnitId(['a', 'b', 'c'], new Set(['a']))).toBe('b')
  })

  it('returns null when all owned units are claimed', () => {
    expect(pickFreeOwnedUnitId(['a', 'b'], new Set(['a', 'b']))).toBeNull()
  })
})

describe('fulfillmentForKnownPlate', () => {
  it('marks owned assignment', () => {
    const result = fulfillmentForKnownPlate('car-1')
    expect(result).toMatchObject({
      assignedCarId: 'car-1',
      fulfillmentSource: 'owned',
      tempPlateLabel: null,
    })
    expect(result.plateConfirmedAt).toBeInstanceOf(Date)
  })
})
