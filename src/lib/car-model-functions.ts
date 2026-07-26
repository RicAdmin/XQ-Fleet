import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm'
import { z } from 'zod'

import { carPhotos, cars, partnerCarModels } from '#/db/schema'
import type { CarCategory } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles } from '#/lib/auth-model'
import {
  listCapacitySummariesByMakeModel,
  type CarCapacityPartnerLine,
  type OwnedCapacityUnit,
} from '#/lib/car-capacity'
import { adminInputValidator, uuidString } from '#/lib/validation/admin-schemas'

export type CarModelListRow = {
  make: string
  model: string
  category: CarCategory
  listingCarId: string
  slug: string | null
  featured: boolean
  availableForBooking: boolean
  ownedCount: number
  ownedUnits: OwnedCapacityUnit[]
  partners: CarCapacityPartnerLine[]
  coverPhotoUrl: string | null
  vehicleCount: number
}

function makeModelKey(make: string, model: string): string {
  return `${make.toLowerCase()}\0${model.toLowerCase()}`
}

function listingScore(row: {
  hasPartners: boolean
  slug: string | null
  featured: boolean
  ownedByFleet: boolean
}): number {
  return (
    (row.hasPartners ? 1000 : 0) +
    (row.slug ? 100 : 0) +
    (row.featured ? 10 : 0) +
    (row.ownedByFleet ? 1 : 0)
  )
}

function pickListingCar<
  T extends {
    id: string
    plateNumber: string
    slug: string | null
    featured: boolean
    ownedByFleet: boolean
  },
>(vehicles: T[], linkedPartnerCarIds: Set<string>): T {
  return [...vehicles].sort((a, b) => {
    const scoreDiff =
      listingScore({
        hasPartners: linkedPartnerCarIds.has(b.id),
        slug: b.slug,
        featured: b.featured,
        ownedByFleet: b.ownedByFleet,
      }) -
      listingScore({
        hasPartners: linkedPartnerCarIds.has(a.id),
        slug: a.slug,
        featured: a.featured,
        ownedByFleet: a.ownedByFleet,
      })
    if (scoreDiff !== 0) return scoreDiff
    return a.plateNumber.localeCompare(b.plateNumber)
  })[0]!
}

export const listCarModels = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CarModelListRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const vehicleRows = await db
      .select({
        id: cars.id,
        make: cars.make,
        model: cars.model,
        category: cars.category,
        slug: cars.slug,
        featured: cars.featured,
        availableForBooking: cars.availableForBooking,
        ownedByFleet: cars.ownedByFleet,
        plateNumber: cars.plateNumber,
        status: cars.status,
      })
      .from(cars)
      .where(ne(cars.status, 'retired'))
      .orderBy(asc(cars.plateNumber))

    if (vehicleRows.length === 0) return []

    const linkedPartnerCarIds = new Set(
      (
        await db
          .selectDistinct({ linkedCarId: partnerCarModels.linkedCarId })
          .from(partnerCarModels)
          .where(sql`${partnerCarModels.linkedCarId} is not null`)
      )
        .map((row) => row.linkedCarId)
        .filter((id): id is string => Boolean(id)),
    )

    const groups = new Map<
      string,
      {
        make: string
        model: string
        category: CarCategory
        vehicles: typeof vehicleRows
      }
    >()

    for (const row of vehicleRows) {
      const key = makeModelKey(row.make, row.model)
      const existing = groups.get(key)
      if (existing) {
        existing.vehicles.push(row)
      } else {
        groups.set(key, {
          make: row.make,
          model: row.model,
          category: row.category,
          vehicles: [row],
        })
      }
    }

    const capacityByMakeModel = await listCapacitySummariesByMakeModel(
      db,
      [...groups.values()].map((g) => ({ make: g.make, model: g.model })),
    )

    const listingIds = [...groups.values()].map(
      (group) => pickListingCar(group.vehicles, linkedPartnerCarIds).id,
    )

    const coverPhotos =
      listingIds.length === 0
        ? []
        : await db
            .select({
              carId: carPhotos.carId,
              url: carPhotos.url,
            })
            .from(carPhotos)
            .where(and(inArray(carPhotos.carId, listingIds), eq(carPhotos.isCover, true)))

    const coverByCarId = new Map(coverPhotos.map((photo) => [photo.carId, photo.url]))

    const models: CarModelListRow[] = []
    for (const group of groups.values()) {
      const listing = pickListingCar(group.vehicles, linkedPartnerCarIds)
      const capacity = capacityByMakeModel.get(makeModelKey(group.make, group.model))
      models.push({
        make: group.make,
        model: group.model,
        category: group.category,
        listingCarId: listing.id,
        slug: listing.slug,
        featured: listing.featured,
        availableForBooking: listing.availableForBooking,
        ownedCount:
          capacity?.ownedCount ??
          Math.max(1, group.vehicles.filter((v) => v.ownedByFleet).length),
        ownedUnits: capacity?.ownedUnits ?? [],
        partners: capacity?.partners ?? [],
        coverPhotoUrl: coverByCarId.get(listing.id) ?? null,
        vehicleCount: group.vehicles.length,
      })
    }

    models.sort((a, b) => {
      const makeCmp = a.make.localeCompare(b.make)
      if (makeCmp !== 0) return makeCmp
      return a.model.localeCompare(b.model)
    })

    return models
  },
)

const modelCarIdSchema = z.object({ carId: uuidString })

export const getCarModelByListingId = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(modelCarIdSchema))
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const [seed] = await db.select().from(cars).where(eq(cars.id, data.carId)).limit(1)
    if (!seed) throw new Error('Car model not found.')

    const siblings = await db
      .select({
        id: cars.id,
        plateNumber: cars.plateNumber,
        color: cars.color,
        year: cars.year,
        status: cars.status,
        ownedByFleet: cars.ownedByFleet,
        slug: cars.slug,
        featured: cars.featured,
      })
      .from(cars)
      .where(
        and(
          sql`lower(${cars.make}) = ${seed.make.toLowerCase()}`,
          sql`lower(${cars.model}) = ${seed.model.toLowerCase()}`,
          ne(cars.status, 'retired'),
        ),
      )
      .orderBy(asc(cars.plateNumber))

    const linkedPartnerCarIds = new Set(
      (
        await db
          .selectDistinct({ linkedCarId: partnerCarModels.linkedCarId })
          .from(partnerCarModels)
          .where(sql`${partnerCarModels.linkedCarId} is not null`)
      )
        .map((row) => row.linkedCarId)
        .filter((id): id is string => Boolean(id)),
    )

    const preferredId = pickListingCar(siblings, linkedPartnerCarIds).id
    const [listing] =
      preferredId === seed.id
        ? [seed]
        : await db.select().from(cars).where(eq(cars.id, preferredId)).limit(1)

    if (!listing) throw new Error('Car model not found.')

    return {
      listing,
      vehicles: siblings.map(({ id, plateNumber, color, year, status, ownedByFleet }) => ({
        id,
        plateNumber,
        color,
        year,
        status,
        ownedByFleet,
      })),
    }
  })
