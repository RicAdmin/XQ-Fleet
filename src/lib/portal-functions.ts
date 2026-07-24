import { createServerFn } from '@tanstack/react-start'
import { and, eq, gt, inArray, lt, notInArray } from 'drizzle-orm'

import { carPhotos, cars, rentals, seasonCalendar } from '#/db/schema'
import type { CarCategory } from '#/db/schema'
import { publicCarCatalogSelect, type PublicCarCatalogFields } from '#/lib/car-catalog'
import { parseLocalYmd } from '#/lib/booking-datetime'
import type { SeasonRange } from '#/lib/pricing-logic'

export type { PublicCarCatalogFields } from '#/lib/car-catalog'

export type PublicCarRow = {
  id: string
  make: string
  model: string
  year: number
  category: CarCategory
  dailyRateSen: number
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
  extHourLowSen?: number
  extHourPeakAndSuperPeakSen?: number
  coverPhotoUrl: string | null
  coverPhotoAlt: string | null
  notes: string | null
} & PublicCarCatalogFields

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
  deliveryFeeJettySen: number
  deliveryFeeHotelSen: number
  minRentalDays: number
  maxRentalDays: number
  availableForBooking: boolean
  notes: string | null
  ownedByFleet: boolean
  vendorName: string | null
  numberOfUnits: number
  lateReturnHourlyFeeSen: number
  notesInternal: string | null
  registrationNumber: string | null
  lastServiceDate: Date | null
  nextServiceDueKm: number | null
  joinedDate: Date | null
  photos: Array<{
    id: string
    url: string
    altText: string | null
    sortOrder: number
    isCover: boolean
  }>
} & PublicCarCatalogFields

/** Map full detail payload to listing row shape (e.g. checkout). */
export function publicCarDetailToRow(car: PublicCarDetail): PublicCarRow {
  const coverPhoto = car.photos.find((p) => p.isCover) ?? car.photos[0]
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    category: car.category,
    dailyRateSen: car.dailyRateSen,
    priceLowSeasonSen: car.priceLowSeasonSen,
    pricePeakSeasonSen: car.pricePeakSeasonSen,
    priceSuperPeakSeasonSen: car.priceSuperPeakSeasonSen,
    extHourLowSen: car.extHourLowSen,
    extHourPeakAndSuperPeakSen: car.extHourPeakAndSuperPeakSen,
    coverPhotoUrl: coverPhoto?.url ?? null,
    coverPhotoAlt: coverPhoto?.altText ?? null,
    notes: car.notes,
    slug: car.slug,
    featured: car.featured,
    passengers: car.passengers,
    doors: car.doors,
    bodyType: car.bodyType,
    transmission: car.transmission,
    fuelType: car.fuelType,
    appleCarPlay: car.appleCarPlay,
    androidAuto: car.androidAuto,
    bootCapacityL: car.bootCapacityL,
    bootCapacityLabel: car.bootCapacityLabel,
    largeSuitcasesCount: car.largeSuitcasesCount,
    smallCarryonsCount: car.smallCarryonsCount,
    combinedCapacityL: car.combinedCapacityL,
    combinedCapacityLabel: car.combinedCapacityLabel,
    tagFunAdventure: car.tagFunAdventure,
    tagFamilyComfort: car.tagFamilyComfort,
    tagSmallOku: car.tagSmallOku,
    fuelPolicy: car.fuelPolicy,
    carLocations: car.carLocations,
    longDescription: car.longDescription,
    highlights: car.highlights,
    metaTitle: car.metaTitle,
    metaDescription: car.metaDescription,
    promotionalPriceSen: car.promotionalPriceSen,
  }
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

/** Homepage cards omit SEO/detail prose to shrink SSR HTML + hydration payload. */
const publicCarHomepageSelect = {
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
  slug: cars.slug,
  featured: cars.featured,
  passengers: cars.passengers,
  doors: cars.doors,
  bodyType: cars.bodyType,
  transmission: cars.transmission,
  fuelType: cars.fuelType,
  appleCarPlay: cars.appleCarPlay,
  androidAuto: cars.androidAuto,
  bootCapacityL: cars.bootCapacityL,
  bootCapacityLabel: cars.bootCapacityLabel,
  largeSuitcasesCount: cars.largeSuitcasesCount,
  smallCarryonsCount: cars.smallCarryonsCount,
  combinedCapacityL: cars.combinedCapacityL,
  combinedCapacityLabel: cars.combinedCapacityLabel,
  tagFunAdventure: cars.tagFunAdventure,
  tagFamilyComfort: cars.tagFamilyComfort,
  tagSmallOku: cars.tagSmallOku,
  fuelPolicy: cars.fuelPolicy,
  carLocations: cars.carLocations,
  promotionalPriceSen: cars.promotionalPriceSen,
} as const

function withHomepageCatalogDefaults(
  row: Omit<PublicCarRow, 'longDescription' | 'highlights' | 'metaTitle' | 'metaDescription'>,
): PublicCarRow {
  return {
    ...row,
    longDescription: null,
    highlights: null,
    metaTitle: null,
    metaDescription: null,
  }
}

// ─── Season calendar (public) ─────────────────────────────────────────────────

export const getPublicSeasonCalendar = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SeasonRange[]> => {
    const { db } = await import('#/db')
    const rows = await db.select().from(seasonCalendar)
    return rows.map((r) => ({
      fromDate: r.fromDate,
      toDate: r.toDate,
      seasonType: r.seasonType,
    }))
  },
)

// ─── Public listing ───────────────────────────────────────────────────────────

export const getPublicCars = createServerFn({ method: 'GET' }).handler(async (): Promise<PublicCarRow[]> => {
  const { db } = await import('#/db')

  const rows = await db
    .select(publicCarListSelect)
    .from(cars)
    .leftJoin(
      carPhotos,
      and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
    )
    .where(and(eq(cars.status, 'available')))
    .orderBy(cars.make, cars.model)

  return rows
})

/** Slimmer listing for homepage SSR — omits longDescription / highlights / meta fields. */
export const getPublicCarsForHomepage = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PublicCarRow[]> => {
    const { db } = await import('#/db')

    const rows = await db
      .select(publicCarHomepageSelect)
      .from(cars)
      .leftJoin(
        carPhotos,
        and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
      )
      .where(and(eq(cars.status, 'available')))
      .orderBy(cars.make, cars.model)

    return rows.map(withHomepageCatalogDefaults)
  },
)

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
      const start = parseLocalYmd(data.startDate)
      const end = parseLocalYmd(data.endDate)
      if (!start || !end) return []

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
      .select(publicCarListSelect)
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
        deliveryFeeJettySen: cars.deliveryFeeJettySen,
        deliveryFeeHotelSen: cars.deliveryFeeHotelSen,
        minRentalDays: cars.minRentalDays,
        maxRentalDays: cars.maxRentalDays,
        availableForBooking: cars.availableForBooking,
        notes: cars.notes,
        ownedByFleet: cars.ownedByFleet,
        vendorName: cars.vendorName,
        numberOfUnits: cars.numberOfUnits,
        lateReturnHourlyFeeSen: cars.lateReturnHourlyFeeSen,
        notesInternal: cars.notesInternal,
        registrationNumber: cars.registrationNumber,
        lastServiceDate: cars.lastServiceDate,
        nextServiceDueKm: cars.nextServiceDueKm,
        joinedDate: cars.joinedDate,
        ...publicCarCatalogSelect,
      })
      .from(cars)
      .where(and(eq(cars.id, data.carId), eq(cars.status, 'available')))
      .limit(1)

    if (!car) return null

    const photos = await db
      .select({
        id: carPhotos.id,
        url: carPhotos.url,
        altText: carPhotos.altText,
        sortOrder: carPhotos.sortOrder,
        isCover: carPhotos.isCover,
      })
      .from(carPhotos)
      .where(eq(carPhotos.carId, data.carId))
      .orderBy(carPhotos.sortOrder)

    return { ...car, photos }
  })
