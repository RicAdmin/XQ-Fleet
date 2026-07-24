import type { CarStatus } from '#/db/schema'

export type CarDisplayStatus = CarStatus | 'overdue'

export type OpenRentalForDisplay = {
  status: string
  startDate: Date | string
  endDate: Date | string
}

export function startOfLocalDay(d: Date): Date {
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  return day
}

/**
 * Derive the badge shown in admin UI from stored car status + open rental dates.
 * Does not mutate DB status:
 * - reserved + pending rental past pickup → overdue
 * - rented + active rental past planned return → overdue
 * - reserved before pickup stays reserved
 */
export function deriveCarDisplayStatus(
  status: CarStatus,
  openRental: OpenRentalForDisplay | null | undefined,
  now: Date = new Date(),
): CarDisplayStatus {
  if (!openRental) return status

  const start = new Date(openRental.startDate)
  const end = new Date(openRental.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return status

  if (status === 'reserved' && openRental.status === 'pending' && start.getTime() <= now.getTime()) {
    return 'overdue'
  }

  if (status === 'rented' && openRental.status === 'active') {
    if (end.getTime() < startOfLocalDay(now).getTime()) return 'overdue'
  }

  return status
}

/** Prefer active rental, else pending — at most one open booking should lock the car. */
export function pickOpenRentalForDisplay<T extends { status: string }>(
  rentals: readonly T[],
): T | null {
  return (
    rentals.find((r) => r.status === 'active') ??
    rentals.find((r) => r.status === 'pending') ??
    null
  )
}

export type OverdueCarBuckets = {
  ids: string[]
  reservedIds: string[]
  rentedIds: string[]
}

/** Cars whose display status is overdue (reserved past pickup or rented past return). */
export async function getOverdueCarBuckets(
  now: Date = new Date(),
): Promise<OverdueCarBuckets> {
  const { and, eq, lt, lte } = await import('drizzle-orm')
  const { cars, rentals } = await import('#/db/schema')
  const { db } = await import('#/db')

  const todayStart = startOfLocalDay(now)

  const [reservedPastPickup, rentedPastReturn] = await Promise.all([
    db
      .selectDistinct({ carId: rentals.carId })
      .from(rentals)
      .innerJoin(cars, eq(cars.id, rentals.carId))
      .where(
        and(
          eq(cars.status, 'reserved'),
          eq(rentals.status, 'pending'),
          lte(rentals.startDate, now),
        ),
      ),
    db
      .selectDistinct({ carId: rentals.carId })
      .from(rentals)
      .innerJoin(cars, eq(cars.id, rentals.carId))
      .where(
        and(
          eq(cars.status, 'rented'),
          eq(rentals.status, 'active'),
          lt(rentals.endDate, todayStart),
        ),
      ),
  ])

  const reservedIds = [...new Set(reservedPastPickup.map((r) => r.carId))]
  const rentedIds = [...new Set(rentedPastReturn.map((r) => r.carId))]

  return {
    reservedIds,
    rentedIds,
    ids: [...new Set([...reservedIds, ...rentedIds])],
  }
}

export async function getOverdueCarIds(now: Date = new Date()): Promise<string[]> {
  const buckets = await getOverdueCarBuckets(now)
  return buckets.ids
}
