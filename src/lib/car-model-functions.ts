import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, gte, inArray, lte, ne, or, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { z } from 'zod'

import { carPhotos, cars, partnerCarModels, rentals } from '#/db/schema'
import type * as schema from '#/db/schema'
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

function coverListingScore(row: { featured: boolean; slug: string | null }): number {
  return (row.featured ? 10 : 0) + (row.slug ? 5 : 0)
}

/** Best cover photo per make/model from any fleet plate in that model group. */
export async function loadCoverPhotoUrlByMakeModel(
  db: NodePgDatabase<typeof schema>,
  makeModels: Array<{ make: string; model: string }>,
): Promise<Map<string, string>> {
  const unique = new Map<string, { make: string; model: string }>()
  for (const mm of makeModels) {
    unique.set(makeModelKey(mm.make, mm.model), mm)
  }
  if (unique.size === 0) return new Map()

  const clauses = [...unique.values()].map((mm) =>
    and(
      sql`lower(${cars.make}) = ${mm.make.toLowerCase()}`,
      sql`lower(${cars.model}) = ${mm.model.toLowerCase()}`,
    ),
  )

  const rows = await db
    .select({
      make: cars.make,
      model: cars.model,
      url: carPhotos.url,
      featured: cars.featured,
      slug: cars.slug,
    })
    .from(carPhotos)
    .innerJoin(cars, eq(carPhotos.carId, cars.id))
    .where(and(eq(carPhotos.isCover, true), or(...clauses)))

  const best = new Map<string, { url: string; score: number }>()
  for (const row of rows) {
    const key = makeModelKey(row.make, row.model)
    const score = coverListingScore(row)
    const current = best.get(key)
    if (!current || score > current.score) {
      best.set(key, { url: row.url, score })
    }
  }

  return new Map([...best.entries()].map(([key, value]) => [key, value.url]))
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

    const allVehicleIds = vehicleRows.map((row) => row.id)

    const coverPhotos =
      allVehicleIds.length === 0
        ? []
        : await db
            .select({
              carId: carPhotos.carId,
              url: carPhotos.url,
            })
            .from(carPhotos)
            .where(and(inArray(carPhotos.carId, allVehicleIds), eq(carPhotos.isCover, true)))

    const coverByCarId = new Map(coverPhotos.map((photo) => [photo.carId, photo.url]))
    const coverByMakeModel = await loadCoverPhotoUrlByMakeModel(
      db,
      [...groups.values()].map((g) => ({ make: g.make, model: g.model })),
    )

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
        coverPhotoUrl:
          coverByCarId.get(listing.id) ??
          group.vehicles.map((vehicle) => coverByCarId.get(vehicle.id)).find(Boolean) ??
          coverByMakeModel.get(makeModelKey(group.make, group.model)) ??
          null,
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

// ── Per-model utilisation (rented days YTD, self-owned fleet) ──────────────

export type CarModelUtilisationEntry = {
  make: string
  model: string
  category: CarCategory
  coverPhotoUrl: string | null
  days: number
  monthlyDays: number[]
}

type RentalSpan = { carId: string; startDate: Date; endDate: Date }

function monthlyRentedDaysYtd(spans: RentalSpan[], yearStart: Date, now: Date) {
  const result = new Map<string, number[]>()
  for (const span of spans) {
    const start = span.startDate > yearStart ? span.startDate : yearStart
    const end = span.endDate < now ? span.endDate : now
    if (end <= start) continue
    const months = result.get(span.carId) ?? Array.from({ length: 12 }, () => 0)
    let cursor = new Date(start)
    while (cursor < end) {
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      const sliceEnd = monthEnd < end ? monthEnd : end
      const days = Math.max(
        0,
        Math.ceil((sliceEnd.getTime() - cursor.getTime()) / 86_400_000),
      )
      months[cursor.getMonth()] += days
      cursor = monthEnd
    }
    result.set(span.carId, months)
  }
  return result
}

export const listCarModelUtilisation = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CarModelUtilisationEntry[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const ownedFleetCars = await db
      .select({
        id: cars.id,
        make: cars.make,
        model: cars.model,
        category: cars.category,
      })
      .from(cars)
      .where(eq(cars.ownedByFleet, true))
    if (ownedFleetCars.length === 0) return []

    const spans = await db
      .select({
        carId: rentals.carId,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
      })
      .from(rentals)
      .where(
        and(
          inArray(
            rentals.carId,
            ownedFleetCars.map((row) => row.id),
          ),
          inArray(rentals.status, ['active', 'closed']),
          lte(rentals.startDate, now),
          gte(rentals.endDate, yearStart),
        ),
      )

    const monthlyByCarId = monthlyRentedDaysYtd(spans, yearStart, now)
    const coverByMakeModel = await loadCoverPhotoUrlByMakeModel(db, ownedFleetCars)

    const byModel = new Map<string, CarModelUtilisationEntry>()
    for (const row of ownedFleetCars) {
      const key = makeModelKey(row.make, row.model)
      const monthly = monthlyByCarId.get(row.id)
      const existing = byModel.get(key)
      if (existing) {
        if (monthly) {
          for (let i = 0; i < 12; i += 1) existing.monthlyDays[i] += monthly[i]
        }
      } else {
        byModel.set(key, {
          make: row.make,
          model: row.model,
          category: row.category,
          coverPhotoUrl: coverByMakeModel.get(key) ?? null,
          days: 0,
          monthlyDays: monthly ? [...monthly] : Array.from({ length: 12 }, () => 0),
        })
      }
    }
    for (const entry of byModel.values()) {
      entry.days = entry.monthlyDays.reduce((sum, d) => sum + d, 0)
    }

    return [...byModel.values()].sort((a, b) => b.days - a.days)
  },
)
