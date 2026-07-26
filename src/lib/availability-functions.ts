import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm'
import { z } from 'zod'

import { cars, rentals } from '#/db/schema'
import type { CarCategory } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles } from '#/lib/auth-model'
import {
  drizzleAvailableCarsForTripDb,
  listAvailableCarsForTrip,
} from '#/lib/available-cars-for-trip'
import { carCategoryFilterSchema, adminInputValidator } from '#/lib/validation/admin-schemas'

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
}

const availabilityInputSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: carCategoryFilterSchema.optional(),
})

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
    const tripStart = new Date(`${data.startDate}T00:00:00`)
    const tripEnd = new Date(`${data.endDate}T23:59:59.999`)

    const fleetConditions = [ne(cars.status, 'retired')]
    if (category) fleetConditions.push(eq(cars.category, category))

    const [catalogCars, fleetRows, overlapRows] = await Promise.all([
      listAvailableCarsForTrip(tripDb, {
        category,
        startDate: data.startDate,
        endDate: data.endDate,
      }),
      db
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
        .orderBy(cars.make, cars.model),
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

    const availableIds = new Set(catalogCars.map((car) => car.id))

    const overlapByCar = new Map(overlapRows.map((row) => [row.carId, row.count]))

    const summary: FleetAvailabilitySummary = {
      totalCars: fleetRows.length,
      availableCars: fleetRows.filter((car) => car.status === 'available').length,
      reservedCars: fleetRows.filter((car) => car.status === 'reserved').length,
      rentedCars: fleetRows.filter((car) => car.status === 'rented').length,
      maintenanceCars: fleetRows.filter((car) => car.status === 'maintenance').length,
    }

    const carsOut: AvailabilityCarRow[] = fleetRows.map((car) => ({
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
    }))

    return { summary, cars: carsOut }
  })
