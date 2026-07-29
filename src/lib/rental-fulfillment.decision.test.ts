import { describe, expect, it } from 'vitest'

import {
  fulfillmentForKnownPlate,
  makePartnerTempLabel,
  makeTempHoldLabel,
  pickFreeOwnedUnitId,
  resolveDisplayPlate,
} from '#/lib/rental-fulfillment'

/**
 * Decision-table proof for booking fulfillment:
 * owned free → assign plate; owned exhausted → HOLD temp label.
 */
describe('fulfillment decision table', () => {
  const listingId = 'listing-1'
  const ownedA = 'owned-a'
  const ownedB = 'owned-b'
  const rentalId = 'a1b2c3d4-0000-0000-0000-000000000001'

  it('online/CS listing: assigns first free owned sibling', () => {
    const free = pickFreeOwnedUnitId([ownedA, ownedB], new Set())
    expect(free).toBe(ownedA)
    const assignment = fulfillmentForKnownPlate(free!)
    expect(assignment.fulfillmentSource).toBe('owned')
    expect(assignment.assignedCarId).toBe(ownedA)
    expect(assignment.tempPlateLabel).toBeNull()
  })

  it('online/CS listing: second booking takes next free owned sibling', () => {
    const free = pickFreeOwnedUnitId([ownedA, ownedB], new Set([ownedA]))
    expect(free).toBe(ownedB)
  })

  it('online/CS listing: when owned units are claimed, uses HOLD temp plate', () => {
    const free = pickFreeOwnedUnitId([ownedA, ownedB], new Set([ownedA, ownedB]))
    expect(free).toBeNull()
    const temp = makeTempHoldLabel(rentalId)
    expect(temp).toBe('HOLD-A1B2-C3D4')
    expect(
      resolveDisplayPlate({
        assignedPlateNumber: null,
        tempPlateLabel: temp,
        listingPlateNumber: 'LISTING-PLATE',
      }),
    ).toBe('HOLD-A1B2-C3D4')
  })

  it('CS known plate picker marks owned immediately', () => {
    const assignment = fulfillmentForKnownPlate(listingId)
    expect(assignment).toMatchObject({
      assignedCarId: listingId,
      fulfillmentSource: 'owned',
      tempPlateLabel: null,
    })
  })

  it('partner hold label is distinct from HOLD', () => {
    expect(makePartnerTempLabel('LAR', rentalId)).toMatch(/^TEMP-LAR-/)
    expect(makePartnerTempLabel('LAR', rentalId)).not.toMatch(/^HOLD-/)
  })

  it('display never shows listing plate when temp hold exists', () => {
    expect(
      resolveDisplayPlate({
        tempPlateLabel: 'HOLD-AAAA-BBBB',
        listingPlateNumber: 'KV9999Z',
      }),
    ).toBe('HOLD-AAAA-BBBB')
  })
})
