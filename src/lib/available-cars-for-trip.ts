import { and, eq, gt, inArray, lt, notInArray } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { carPhotos, cars, rentals } from '#/db/schema'
import type { CarCategory } from '#/db/schema'
import type * as schema from '#/db/schema'
import { publicCarCatalogSelect } from '#/lib/car-catalog'
import { parseLocalYmd } from '#/lib/booking-datetime'
import type { PublicCarRow } from '#/lib/portal-functions'

export const BLOCKING_RENTAL_STATUSES = ['pending', 'active'] as const

export type TripListingInput = {
  category?: string
  startDate?: string
  endDate?: string
}

export type AvailableCarsForTripDb = {
  listAvailableCars: (opts: {
    category?: CarCategory
    excludeCarIds?: string[]
  }) => Promise<PublicCarRow[]>
  findCarIdsWithBlockingRentals: (tripStart: Date, tripEnd: Date) => Promise<string[]>
}

/** Open-interval overlap: rental blocks the Trip when rental.start < tripEnd && rental.end > tripStart. */
export function rentalIntervalsOverlap(
  rentalStart: Date,
  rentalEnd: Date,
  tripStart: Date,
  tripEnd: Date,
): boolean {
  return rentalStart < tripEnd && rentalEnd > tripStart
}

export async function listAvailableCarsForTrip(
  db: AvailableCarsForTripDb,
  input: TripListingInput,
): Promise<PublicCarRow[]> {
  let excludeCarIds: string[] | undefined

  if (input.startDate && input.endDate) {
    const tripStart = parseLocalYmd(input.startDate)
    const tripEnd = parseLocalYmd(input.endDate)
    if (!tripStart || !tripEnd) return []

    const conflictingIds = await db.findCarIdsWithBlockingRentals(tripStart, tripEnd)
    if (conflictingIds.length > 0) {
      excludeCarIds = conflictingIds
    }
  }

  const category =
    input.category && input.category !== 'all' ? (input.category as CarCategory) : undefined

  return db.listAvailableCars({ category, excludeCarIds })
}

const publicCarListSelect = {
  id: cars.id,
  make: cars.make,
  model: cars.model,
  year: cars.year,
  category: cars.category,
  dailyRateSen: cars.dailyRateSen,
  priceLowSeasonSen: cars.priceLowSeasonSen,
  pricePeakSeasonSen: cars.pricePeakSeasonSen,
  priceSuperPeakSeasonSen: cars.priceSuperPeakSeasonSen,
  extHourLowSen: cars.extHourLowSen,
  extHourPeakAndSuperPeakSen: cars.extHourPeakAndSuperPeakSen,
  coverPhotoUrl: carPhotos.url,
  coverPhotoAlt: carPhotos.altText,
  notes: cars.notes,
  ...publicCarCatalogSelect,
} as const

export function drizzleAvailableCarsForTripDb(
  db: NodePgDatabase<typeof schema>,
): AvailableCarsForTripDb {
  return {
    async findCarIdsWithBlockingRentals(tripStart, tripEnd) {
      const conflicting = await db
        .select({ carId: rentals.carId })
        .from(rentals)
        .where(
          and(
            inArray(rentals.status, [...BLOCKING_RENTAL_STATUSES]),
            lt(rentals.startDate, tripEnd),
            gt(rentals.endDate, tripStart),
          ),
        )
      return conflicting.map((row) => row.carId)
    },

    async listAvailableCars({ category, excludeCarIds }) {
      const conditions = [eq(cars.status, 'available')]

      if (category) {
        conditions.push(eq(cars.category, category))
      }

      if (excludeCarIds && excludeCarIds.length > 0) {
        conditions.push(notInArray(cars.id, excludeCarIds))
      }

      return db
        .select(publicCarListSelect)
        .from(cars)
        .leftJoin(
          carPhotos,
          and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
        )
        .where(and(...conditions))
        .orderBy(cars.make, cars.model)
    },
  }
}
