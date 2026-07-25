import { and, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { cars, rentals } from '#/db/schema'
import type * as schema from '#/db/schema'

import { BLOCKING_RENTAL_STATUSES } from '#/lib/available-cars-for-trip'

export type FleetCapacity = {
  numberOfUnits: number
  overbookUnits: number
}

/** Max concurrent pending/active bookings allowed for a catalog car row. */
export function fleetBookingCapacity(fleet: FleetCapacity): number {
  const units = Number.isFinite(fleet.numberOfUnits) ? Math.max(1, fleet.numberOfUnits) : 1
  const overbook = Number.isFinite(fleet.overbookUnits) ? Math.max(0, fleet.overbookUnits) : 0
  return units + overbook
}

export function isFleetAtCapacity(overlapCount: number, fleet: FleetCapacity): boolean {
  return overlapCount >= fleetBookingCapacity(fleet)
}

/** Single-slot models keep legacy per-car status transitions (reserved / rented / payment-pending). */
export function usesSingleUnitCarStatus(fleet: FleetCapacity): boolean {
  return fleetBookingCapacity(fleet) <= 1
}

type FleetCapacityDb = Pick<NodePgDatabase<typeof schema>, 'select'>

export async function getCarFleetCapacity(
  db: FleetCapacityDb,
  carId: string,
): Promise<FleetCapacity | null> {
  const [row] = await db
    .select({
      numberOfUnits: cars.numberOfUnits,
      overbookUnits: cars.overbookUnits,
    })
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1)

  if (!row) return null
  return { numberOfUnits: row.numberOfUnits, overbookUnits: row.overbookUnits }
}

export async function countBlockingOverlapsForCar(
  db: FleetCapacityDb,
  opts: {
    carId: string
    tripStart: Date
    tripEnd: Date
    excludeRentalId?: string
  },
): Promise<number> {
  const conditions = [
    eq(rentals.carId, opts.carId),
    inArray(rentals.status, [...BLOCKING_RENTAL_STATUSES]),
    lt(rentals.startDate, opts.tripEnd),
    gt(rentals.endDate, opts.tripStart),
  ]

  if (opts.excludeRentalId) {
    conditions.push(ne(rentals.id, opts.excludeRentalId))
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rentals)
    .where(and(...conditions))

  return Number(row?.count ?? 0)
}

export async function assertCarHasBookingCapacity(
  db: FleetCapacityDb,
  opts: {
    carId: string
    tripStart: Date
    tripEnd: Date
    excludeRentalId?: string
    capacity?: FleetCapacity
    errorMessage?: string
  },
): Promise<FleetCapacity> {
  const capacity =
    opts.capacity ?? (await getCarFleetCapacity(db, opts.carId)) ?? {
      numberOfUnits: 1,
      overbookUnits: 0,
    }

  const overlapCount = await countBlockingOverlapsForCar(db, opts)
  if (isFleetAtCapacity(overlapCount, capacity)) {
    throw new Error(opts.errorMessage ?? 'This car is not available for the selected dates.')
  }

  return capacity
}

export async function findCarIdsAtBookingCapacity(
  db: FleetCapacityDb,
  tripStart: Date,
  tripEnd: Date,
): Promise<string[]> {
  const rows = await db
    .select({
      carId: rentals.carId,
      overlapCount: sql<number>`count(*)::int`,
      numberOfUnits: cars.numberOfUnits,
      overbookUnits: cars.overbookUnits,
    })
    .from(rentals)
    .innerJoin(cars, eq(cars.id, rentals.carId))
    .where(
      and(
        inArray(rentals.status, [...BLOCKING_RENTAL_STATUSES]),
        lt(rentals.startDate, tripEnd),
        gt(rentals.endDate, tripStart),
      ),
    )
    .groupBy(rentals.carId, cars.numberOfUnits, cars.overbookUnits)

  return rows
    .filter((row) =>
      isFleetAtCapacity(row.overlapCount, {
        numberOfUnits: row.numberOfUnits,
        overbookUnits: row.overbookUnits,
      }),
    )
    .map((row) => row.carId)
}
