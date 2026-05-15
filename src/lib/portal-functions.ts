import { createServerFn } from '@tanstack/react-start'
import { and, eq, gt, inArray, lt, notInArray } from 'drizzle-orm'

import { carPhotos, cars, rentals } from '#/db/schema'
import type { CarCategory } from '#/db/schema'

export type PublicCarRow = {
  id: string
  make: string
  model: string
  year: number
  category: CarCategory
  dailyRateSen: number
  coverPhotoUrl: string | null
}

export type PublicCarDetail = {
  id: string
  make: string
  model: string
  year: number
  category: CarCategory
  dailyRateSen: number
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
  extHourLowSen: number
  extHourPeakAndSuperPeakSen: number
  deliveryFeeAirportSen: number
  deliveryFeeHotelSen: number
  minRentalDays: number
  maxRentalDays: number
  availableForBooking: boolean
  notes: string | null
  photos: Array<{
    id: string
    url: string
    sortOrder: number
    isCover: boolean
  }>
}

// ─── Public listing ───────────────────────────────────────────────────────────

export const getPublicCars = createServerFn({ method: 'GET' }).handler(async (): Promise<PublicCarRow[]> => {
  const { db } = await import('#/db')

  const rows = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      year: cars.year,
      category: cars.category,
      dailyRateSen: cars.dailyRateSen,
      coverPhotoUrl: carPhotos.url,
    })
    .from(cars)
    .leftJoin(
      carPhotos,
      and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
    )
    .where(and(
      eq(cars.status, 'available'),
    ))
    .orderBy(cars.make, cars.model)

  return rows
})

// ─── Filtered public listing ──────────────────────────────────────────────────

type FilterPublicCarsInput = {
  category?: string
  startDate?: string
  endDate?: string
}

export const filterPublicCars = createServerFn({ method: 'GET' })
  .inputValidator((input: FilterPublicCarsInput) => input)
  .handler(async ({ data }): Promise<PublicCarRow[]> => {
    const { db } = await import('#/db')

    const conditions = [eq(cars.status, 'available')]

    if (data.category && data.category !== 'all') {
      conditions.push(eq(cars.category, data.category as CarCategory))
    }

    // If date range provided, exclude cars with overlapping rentals
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)

      const conflicting = await db
        .select({ carId: rentals.carId })
        .from(rentals)
        .where(
          and(
            inArray(rentals.status, ['pending', 'active']),
            lt(rentals.startDate, end),
            gt(rentals.endDate, start),
          ),
        )

      const conflictingIds = conflicting.map((r) => r.carId)
      if (conflictingIds.length > 0) {
        conditions.push(notInArray(cars.id, conflictingIds))
      }
    }

    const rows = await db
      .select({
        id: cars.id,
        make: cars.make,
        model: cars.model,
        year: cars.year,
        category: cars.category,
        dailyRateSen: cars.dailyRateSen,
        coverPhotoUrl: carPhotos.url,
      })
      .from(cars)
      .leftJoin(
        carPhotos,
        and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
      )
      .where(and(...conditions))
      .orderBy(cars.make, cars.model)

    return rows
  })

// ─── Public car detail ────────────────────────────────────────────────────────

type GetPublicCarDetailInput = { carId: string }

export const getPublicCarDetail = createServerFn({ method: 'GET' })
  .inputValidator((input: GetPublicCarDetailInput) => input)
  .handler(async ({ data }): Promise<PublicCarDetail | null> => {
    const { db } = await import('#/db')

    const [car] = await db
      .select({
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
        deliveryFeeAirportSen: cars.deliveryFeeAirportSen,
        deliveryFeeHotelSen: cars.deliveryFeeHotelSen,
        minRentalDays: cars.minRentalDays,
        maxRentalDays: cars.maxRentalDays,
        availableForBooking: cars.availableForBooking,
        notes: cars.notes,
      })
      .from(cars)
      .where(and(eq(cars.id, data.carId), eq(cars.status, 'available')))
      .limit(1)

    if (!car) return null

    const photos = await db
      .select({
        id: carPhotos.id,
        url: carPhotos.url,
        sortOrder: carPhotos.sortOrder,
        isCover: carPhotos.isCover,
      })
      .from(carPhotos)
      .where(eq(carPhotos.carId, data.carId))
      .orderBy(carPhotos.sortOrder)

    return { ...car, photos }
  })
