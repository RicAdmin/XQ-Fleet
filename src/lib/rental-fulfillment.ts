import { and, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { cars, rentals } from '#/db/schema'
import type { RentalFulfillmentSource } from '#/db/schema'
import type * as schema from '#/db/schema'
import { BLOCKING_RENTAL_STATUSES } from '#/lib/available-cars-for-trip'
import { listOwnedSiblingUnits } from '#/lib/car-capacity'
import { makeBookingRef } from '#/emails/email-helpers'

type Db = Pick<NodePgDatabase<typeof schema>, 'select' | 'update'>

export type FulfillmentAssignment = {
  assignedCarId: string | null
  fulfillmentSource: RentalFulfillmentSource
  partnerId: string | null
  partnerCarModelId: string | null
  tempPlateLabel: string | null
  plateConfirmedAt: Date | null
}

/** Prefer assigned plate, then temp hold label, then listing plate. */
export function resolveDisplayPlate(opts: {
  assignedPlateNumber?: string | null
  tempPlateLabel?: string | null
  listingPlateNumber?: string | null
}): string {
  const assigned = opts.assignedPlateNumber?.trim()
  if (assigned) return assigned
  const temp = opts.tempPlateLabel?.trim()
  if (temp) return temp
  const listing = opts.listingPlateNumber?.trim()
  if (listing) return listing
  return 'TBC'
}

export function makeTempHoldLabel(rentalId: string): string {
  return `HOLD-${makeBookingRef(rentalId)}`
}

export function makePartnerTempLabel(partnerCode: string, rentalId: string): string {
  const code = partnerCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'P'
  return `TEMP-${code}-${makeBookingRef(rentalId).replace('-', '')}`
}

/** Pure pick: first owned plate not already claimed. */
export function pickFreeOwnedUnitId(
  ownedUnitIds: string[],
  claimedAssignedCarIds: ReadonlySet<string>,
): string | null {
  for (const id of ownedUnitIds) {
    if (!claimedAssignedCarIds.has(id)) return id
  }
  return null
}

export async function listClaimedAssignedCarIds(
  db: Db,
  opts: {
    tripStart: Date
    tripEnd: Date
    excludeRentalId?: string
  },
): Promise<Set<string>> {
  const conditions = [
    inArray(rentals.status, [...BLOCKING_RENTAL_STATUSES]),
    lt(rentals.startDate, opts.tripEnd),
    gt(rentals.endDate, opts.tripStart),
    sql`${rentals.assignedCarId} is not null`,
  ]
  if (opts.excludeRentalId) {
    conditions.push(ne(rentals.id, opts.excludeRentalId))
  }

  const rows = await db
    .select({ assignedCarId: rentals.assignedCarId })
    .from(rentals)
    .where(and(...conditions))

  return new Set(
    rows
      .map((row) => row.assignedCarId)
      .filter((id): id is string => Boolean(id)),
  )
}

/**
 * Resolve fulfillment for a new booking against a listing/capacity car.
 * Owned plate if a free sibling exists; otherwise unassigned temp hold.
 */
export async function resolveFulfillmentForListingCar(
  db: Db,
  opts: {
    listingCarId: string
    tripStart: Date
    tripEnd: Date
    rentalIdForTempLabel: string
    excludeRentalId?: string
  },
): Promise<FulfillmentAssignment> {
  const [listing] = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      ownedByFleet: cars.ownedByFleet,
      status: cars.status,
    })
    .from(cars)
    .where(eq(cars.id, opts.listingCarId))
    .limit(1)

  if (!listing) throw new Error('Vehicle not found.')

  const ownedUnits = await listOwnedSiblingUnits(db as Parameters<typeof listOwnedSiblingUnits>[0], {
    carId: listing.id,
    make: listing.make,
    model: listing.model,
  })
  const claimed = await listClaimedAssignedCarIds(db, {
    tripStart: opts.tripStart,
    tripEnd: opts.tripEnd,
    excludeRentalId: opts.excludeRentalId,
  })
  const freeOwnedId = pickFreeOwnedUnitId(
    ownedUnits.map((unit) => unit.id),
    claimed,
  )

  if (freeOwnedId) {
    return {
      assignedCarId: freeOwnedId,
      fulfillmentSource: 'owned',
      partnerId: null,
      partnerCarModelId: null,
      tempPlateLabel: null,
      plateConfirmedAt: new Date(),
    }
  }

  return {
    assignedCarId: null,
    fulfillmentSource: 'unassigned',
    partnerId: null,
    partnerCarModelId: null,
    tempPlateLabel: makeTempHoldLabel(opts.rentalIdForTempLabel),
    plateConfirmedAt: null,
  }
}

/** When CS picks a concrete plate, treat it as owned assignment on that car. */
export function fulfillmentForKnownPlate(carId: string): FulfillmentAssignment {
  return {
    assignedCarId: carId,
    fulfillmentSource: 'owned',
    partnerId: null,
    partnerCarModelId: null,
    tempPlateLabel: null,
    plateConfirmedAt: new Date(),
  }
}
