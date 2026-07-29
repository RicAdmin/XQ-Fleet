import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, inArray, lte, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { carPhotos, cars, rentals } from '#/db/schema'
import type { CarCategory } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles } from '#/lib/auth-model'
import {
  drizzleAvailableCarsForTripDb,
  listAvailableCarsForTrip,
} from '#/lib/available-cars-for-trip'
import { loadCoverPhotoUrlByMakeModel } from '#/lib/car-model-functions'
import { carCategoryFilterSchema, adminInputValidator, uuidString } from '#/lib/validation/admin-schemas'

export type FleetAvailabilitySummary = {
  totalCars: number
  availableCars: number
  reservedCars: number
  rentedCars: number
  maintenanceCars: number
}

export type AvailabilityCarRow = {
  id: string
  make: string
  model: string
  year: number
  category: CarCategory
  plateNumber: string | null
  status: string
  numberOfUnits: number
  overbookUnits: number
  dailyRateSen: number
  availableForTrip: boolean
  blockingRentals: number
  coverPhotoUrl: string | null
}

const availabilityInputSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    category: carCategoryFilterSchema.optional(),
  })
  .refine(
    (data) =>
      (!data.startDate && !data.endDate) ||
      (Boolean(data.startDate) && Boolean(data.endDate)),
    { message: 'Both start and end dates are required together.' },
  )

export const getFleetAvailability = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(availabilityInputSchema))
  .handler(async ({ data }): Promise<{
    summary: FleetAvailabilitySummary
    cars: AvailabilityCarRow[]
  }> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const tripDb = drizzleAvailableCarsForTripDb(db)
    const category =
      data.category && data.category !== 'all' ? data.category : undefined
    const hasDateRange = Boolean(data.startDate && data.endDate)

    const fleetConditions = [ne(cars.status, 'retired')]
    if (category) fleetConditions.push(eq(cars.category, category))

    const fleetRows = await db
      .select({
        id: cars.id,
        make: cars.make,
        model: cars.model,
        year: cars.year,
        category: cars.category,
        plateNumber: cars.plateNumber,
        status: cars.status,
        numberOfUnits: cars.numberOfUnits,
        overbookUnits: cars.overbookUnits,
        dailyRateSen: cars.dailyRateSen,
      })
      .from(cars)
      .where(and(...fleetConditions))
      .orderBy(cars.make, cars.model)

    let catalogCars: Awaited<ReturnType<typeof listAvailableCarsForTrip>> = []
    let overlapByCar = new Map<string, number>()

    if (hasDateRange) {
      const tripStart = new Date(`${data.startDate}T00:00:00`)
      const tripEnd = new Date(`${data.endDate}T23:59:59.999`)

      const [availableCars, overlapRows] = await Promise.all([
        listAvailableCarsForTrip(tripDb, {
          category,
          startDate: data.startDate!,
          endDate: data.endDate!,
        }),
        db
          .select({
            carId: rentals.carId,
            count: sql<number>`count(*)::int`,
          })
          .from(rentals)
          .where(
            and(
              inArray(rentals.status, ['pending', 'active']),
              lte(rentals.startDate, tripEnd),
              gte(rentals.endDate, tripStart),
            ),
          )
          .groupBy(rentals.carId),
      ])

      catalogCars = availableCars
      overlapByCar = new Map(overlapRows.map((row) => [row.carId, row.count]))
    }

    const availableIds = new Set(catalogCars.map((car) => car.id))

    const carIds = fleetRows.map((car) => car.id)
    const coverPhotos =
      carIds.length === 0
        ? []
        : await db
            .select({
              carId: carPhotos.carId,
              url: carPhotos.url,
            })
            .from(carPhotos)
            .where(and(inArray(carPhotos.carId, carIds), eq(carPhotos.isCover, true)))

    const coverByCarId = new Map(coverPhotos.map((photo) => [photo.carId, photo.url]))
    const coverByMakeModel = await loadCoverPhotoUrlByMakeModel(
      db,
      fleetRows.map((row) => ({ make: row.make, model: row.model })),
    )

    const summary: FleetAvailabilitySummary = {
      totalCars: fleetRows.length,
      availableCars: fleetRows.filter((car) => car.status === 'available').length,
      reservedCars: fleetRows.filter((car) => car.status === 'reserved').length,
      rentedCars: fleetRows.filter((car) => car.status === 'rented').length,
      maintenanceCars: fleetRows.filter((car) => car.status === 'maintenance').length,
    }

    const carsOut: AvailabilityCarRow[] = fleetRows.map((car) => {
      const capacityKey = `${car.make.toLowerCase()}\0${car.model.toLowerCase()}`
      return {
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        category: car.category,
        plateNumber: car.plateNumber,
        status: car.status,
        numberOfUnits: car.numberOfUnits,
        overbookUnits: car.overbookUnits,
        dailyRateSen: car.dailyRateSen,
        availableForTrip: availableIds.has(car.id),
        blockingRentals: overlapByCar.get(car.id) ?? 0,
        coverPhotoUrl:
          coverByCarId.get(car.id) ?? coverByMakeModel.get(capacityKey) ?? null,
      }
    })

    return { summary, cars: carsOut }
  })

export type CarRentalDateRange = {
  id: string
  status: string
  startDate: string
  endDate: string
}

const carRentalDatesInputSchema = z.object({
  carId: uuidString,
  year: z.number().int().min(2000).max(2100).optional(),
})

export const getCarRentalDates = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(carRentalDatesInputSchema))
  .handler(async ({ data }): Promise<{ year: number; rentals: CarRentalDateRange[] }> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const year = data.year ?? null
    const conditions = [
      or(eq(rentals.carId, data.carId), eq(rentals.assignedCarId, data.carId)),
      inArray(rentals.status, ['pending', 'active']),
    ]
    if (year !== null) {
      conditions.push(lte(rentals.startDate, new Date(year, 11, 31, 23, 59, 59, 999)))
      conditions.push(gte(rentals.endDate, new Date(year, 0, 1)))
    }

    const rows = await db
      .select({
        id: rentals.id,
        status: rentals.status,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
      })
      .from(rentals)
      .where(and(...conditions))
      .orderBy(rentals.startDate)

    return {
      year: year ?? new Date().getFullYear(),
      rentals: rows.map((row) => ({
        id: row.id,
        status: row.status,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
      })),
    }
  })
