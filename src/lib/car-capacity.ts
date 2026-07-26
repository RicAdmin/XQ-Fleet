import { and, asc, eq, ne, or, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

import { cars, partnerCarModels, partners, rentals } from '#/db/schema'
import type { CarColor, CarStatus } from '#/db/schema'
import type * as schema from '#/db/schema'
import { fleetBookingCapacity } from '#/lib/fleet-capacity'

type Db = Pick<NodePgDatabase<typeof schema>, 'select' | 'update' | 'insert' | 'delete'>

export type CapacityOwnedUnit = {
  id: string
  plateNumber: string
  color: CarColor
  year: number
  status: CarStatus
  isCurrent: boolean
}

export type OwnedCapacityUnit = {
  plateNumber: string
  color: CarColor
  year: number
}

export type CapacityPartnerAllocation = {
  modelId: string
  partnerId: string
  partnerName: string
  partnerCode: string
  maxUnits: number
  isActive: boolean
}

export type CarCapacityBoard = {
  carId: string
  make: string
  model: string
  category: string
  ownedUnits: CapacityOwnedUnit[]
  partnerAllocations: CapacityPartnerAllocation[]
  ownedCount: number
  partnerOverbookTotal: number
  numberOfUnits: number
  overbookUnits: number
  maxConcurrent: number
}

/** Active partner overbook total from allocation rows. */
export function sumActivePartnerOverbook(
  rows: ReadonlyArray<{ maxUnits: number; isActive: boolean }>,
): number {
  return rows.reduce((total, row) => {
    if (!row.isActive) return total
    const units = Number.isFinite(row.maxUnits) ? Math.max(0, Math.floor(row.maxUnits)) : 0
    return total + units
  }, 0)
}

export type CarCapacityPartnerLine = {
  partnerCode: string
  maxUnits: number
}

export type CarCapacitySummary = {
  ownedCount: number
  ownedUnits: OwnedCapacityUnit[]
  partners: CarCapacityPartnerLine[]
}

function makeModelKey(make: string, model: string): string {
  return `${make.toLowerCase()}\0${model.toLowerCase()}`
}

/** Batch capacity summary keyed by lowercase make+model. */
export async function listCapacitySummariesByMakeModel(
  db: Db,
  items: ReadonlyArray<{ make: string; model: string }>,
): Promise<Map<string, CarCapacitySummary>> {
  const keys = new Set(items.map((item) => makeModelKey(item.make, item.model)))
  const result = new Map<string, CarCapacitySummary>()
  if (keys.size === 0) return result

  const [ownedSiblingRows, partnerRows] = await Promise.all([
    db
      .select({
        make: sql<string>`lower(${cars.make})`,
        model: sql<string>`lower(${cars.model})`,
        plateNumber: cars.plateNumber,
        color: cars.color,
        year: cars.year,
      })
      .from(cars)
      .where(and(eq(cars.ownedByFleet, true), ne(cars.status, 'retired')))
      .orderBy(asc(cars.plateNumber)),
    db
      .select({
        make: sql<string>`lower(${cars.make})`,
        model: sql<string>`lower(${cars.model})`,
        partnerCode: partners.code,
        maxUnits: partnerCarModels.maxUnits,
        isActive: partnerCarModels.isActive,
      })
      .from(partnerCarModels)
      .innerJoin(cars, eq(partnerCarModels.linkedCarId, cars.id))
      .innerJoin(partners, eq(partners.id, partnerCarModels.partnerId))
      .where(ne(cars.status, 'retired')),
  ])

  const ownedUnitsByKey = new Map<string, OwnedCapacityUnit[]>()
  for (const row of ownedSiblingRows) {
    const key = `${row.make}\0${row.model}`
    if (!keys.has(key)) continue
    const list = ownedUnitsByKey.get(key) ?? []
    list.push({
      plateNumber: row.plateNumber,
      color: row.color,
      year: row.year,
    })
    ownedUnitsByKey.set(key, list)
  }

  const partnersByKey = new Map<string, Map<string, number>>()
  for (const row of partnerRows) {
    if (!row.isActive) continue
    const key = `${row.make}\0${row.model}`
    if (!keys.has(key)) continue
    const units = Number.isFinite(row.maxUnits) ? Math.max(0, Math.floor(row.maxUnits)) : 0
    const byCode = partnersByKey.get(key) ?? new Map<string, number>()
    const existing = byCode.get(row.partnerCode) ?? 0
    byCode.set(row.partnerCode, Math.max(existing, units))
    partnersByKey.set(key, byCode)
  }

  for (const key of keys) {
    const ownedUnits = ownedUnitsByKey.get(key) ?? []
    const ownedCount = Math.max(1, ownedUnits.length)
    const partnerMap = partnersByKey.get(key)
    const partners = partnerMap
      ? [...partnerMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([partnerCode, maxUnits]) => ({ partnerCode, maxUnits }))
      : []
    result.set(key, { ownedCount, ownedUnits, partners })
  }

  return result
}

/** Owned unit count stored on the listing car (floor 1). */
export function ownedUnitCountFromSiblings(siblingCount: number): number {
  return Math.max(1, Math.floor(siblingCount))
}

export async function listOwnedSiblingUnits(
  db: Db,
  opts: { carId: string; make: string; model: string },
): Promise<CapacityOwnedUnit[]> {
  const rows = await db
    .select({
      id: cars.id,
      plateNumber: cars.plateNumber,
      color: cars.color,
      year: cars.year,
      status: cars.status,
    })
    .from(cars)
    .where(
      and(
        sql`lower(${cars.make}) = ${opts.make.toLowerCase()}`,
        sql`lower(${cars.model}) = ${opts.model.toLowerCase()}`,
        eq(cars.ownedByFleet, true),
        ne(cars.status, 'retired'),
      ),
    )
    .orderBy(asc(cars.plateNumber))

  return rows.map((row) => ({
    ...row,
    isCurrent: row.id === opts.carId,
  }))
}

export async function listPartnerAllocationsForCar(
  db: Db,
  carId: string,
): Promise<CapacityPartnerAllocation[]> {
  const rows = await db
    .select({
      modelId: partnerCarModels.id,
      partnerId: partnerCarModels.partnerId,
      partnerName: partners.name,
      partnerCode: partners.code,
      maxUnits: partnerCarModels.maxUnits,
      isActive: partnerCarModels.isActive,
    })
    .from(partnerCarModels)
    .innerJoin(partners, eq(partners.id, partnerCarModels.partnerId))
    .where(eq(partnerCarModels.linkedCarId, carId))
    .orderBy(asc(partners.name))

  return rows
}

/** Recount owned siblings and write `cars.numberOfUnits`. */
export async function syncCarOwnedUnitCount(db: Db, carId: string): Promise<number> {
  const [car] = await db
    .select({ id: cars.id, make: cars.make, model: cars.model })
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1)

  if (!car) throw new Error('Vehicle not found.')

  const ownedUnits = await listOwnedSiblingUnits(db, {
    carId,
    make: car.make,
    model: car.model,
  })
  const numberOfUnits = ownedUnitCountFromSiblings(ownedUnits.length)

  await db
    .update(cars)
    .set({ numberOfUnits, updatedAt: new Date() })
    .where(eq(cars.id, carId))

  return numberOfUnits
}

/** Sum active linked partner models into `cars.overbookUnits`. */
export async function syncCarOverbookUnitsFromPartnerModels(
  db: Db,
  carId: string,
): Promise<number> {
  const [car] = await db
    .select({ id: cars.id })
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1)

  if (!car) throw new Error('Vehicle not found.')

  const allocations = await listPartnerAllocationsForCar(db, carId)
  const overbookUnits = sumActivePartnerOverbook(allocations)

  await db
    .update(cars)
    .set({ overbookUnits, updatedAt: new Date() })
    .where(eq(cars.id, carId))

  return overbookUnits
}

export async function buildCarCapacityBoard(
  db: Db,
  carId: string,
  opts?: { syncOwned?: boolean },
): Promise<CarCapacityBoard | null> {
  const [car] = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      category: cars.category,
      numberOfUnits: cars.numberOfUnits,
      overbookUnits: cars.overbookUnits,
    })
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1)

  if (!car) return null

  let numberOfUnits = car.numberOfUnits
  if (opts?.syncOwned) {
    numberOfUnits = await syncCarOwnedUnitCount(db, carId)
  }

  const ownedUnits = await listOwnedSiblingUnits(db, {
    carId,
    make: car.make,
    model: car.model,
  })
  const partnerAllocations = await listPartnerAllocationsForCar(db, carId)
  const partnerOverbookTotal = sumActivePartnerOverbook(partnerAllocations)
  const ownedCount = ownedUnits.length
  const effectiveOwned = Math.max(1, numberOfUnits)

  return {
    carId: car.id,
    make: car.make,
    model: car.model,
    category: car.category,
    ownedUnits,
    partnerAllocations,
    ownedCount,
    partnerOverbookTotal,
    numberOfUnits: effectiveOwned,
    overbookUnits: partnerOverbookTotal,
    maxConcurrent: fleetBookingCapacity({
      numberOfUnits: effectiveOwned,
      overbookUnits: partnerOverbookTotal,
    }),
  }
}

/**
 * Single-pass capacity board load: one car fetch, parallel sibling/partner
 * reads, optional single UPDATE when stored counts drifted.
 */
export async function loadAndSyncCarCapacityBoard(
  db: Db,
  carId: string,
): Promise<CarCapacityBoard | null> {
  const [car] = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      category: cars.category,
      numberOfUnits: cars.numberOfUnits,
      overbookUnits: cars.overbookUnits,
    })
    .from(cars)
    .where(eq(cars.id, carId))
    .limit(1)

  if (!car) return null

  const [ownedUnits, partnerAllocations] = await Promise.all([
    listOwnedSiblingUnits(db, {
      carId,
      make: car.make,
      model: car.model,
    }),
    listPartnerAllocationsForCar(db, carId),
  ])

  const numberOfUnits = ownedUnitCountFromSiblings(ownedUnits.length)
  const overbookUnits = sumActivePartnerOverbook(partnerAllocations)

  if (car.numberOfUnits !== numberOfUnits || car.overbookUnits !== overbookUnits) {
    await db
      .update(cars)
      .set({
        ...(car.numberOfUnits !== numberOfUnits ? { numberOfUnits } : {}),
        ...(car.overbookUnits !== overbookUnits ? { overbookUnits } : {}),
        updatedAt: new Date(),
      })
      .where(eq(cars.id, carId))
  }

  return {
    carId: car.id,
    make: car.make,
    model: car.model,
    category: car.category,
    ownedUnits,
    partnerAllocations,
    ownedCount: ownedUnits.length,
    partnerOverbookTotal: overbookUnits,
    numberOfUnits,
    overbookUnits,
    maxConcurrent: fleetBookingCapacity({ numberOfUnits, overbookUnits }),
  }
}

export type PartnerAllocationInput = {
  partnerId: string
  maxUnits: number
  isActive?: boolean
}

export type OwnedUnitInput = {
  carId?: string
  plateNumber: string
  color: CarColor
  year: number
}

function normalizeOwnedPlate(plate: string): string {
  const plateNumber = plate.trim().toUpperCase()
  if (!plateNumber) throw new Error('Plate number is required for every owned unit.')
  if (!/^[A-Z0-9 -]+$/.test(plateNumber)) {
    throw new Error('Plate number contains invalid characters.')
  }
  return plateNumber
}

function validateOwnedUnitYear(year: number): number {
  const currentYear = new Date().getFullYear()
  if (!Number.isInteger(year) || year < 1960 || year > currentYear + 1) {
    throw new Error(`Year must be between 1960 and ${currentYear + 1}.`)
  }
  return year
}

type CarTemplateRow = typeof cars.$inferSelect

function siblingInsertFromTemplate(
  template: CarTemplateRow,
  unit: Pick<OwnedUnitInput, 'plateNumber' | 'color' | 'year'>,
) {
  return {
    plateNumber: unit.plateNumber,
    make: template.make,
    model: template.model,
    year: unit.year,
    color: unit.color,
    category: template.category,
    status: 'available' as const,
    dailyRateSen: template.dailyRateSen,
    priceLowSeasonSen: template.priceLowSeasonSen,
    pricePeakSeasonSen: template.pricePeakSeasonSen,
    priceSuperPeakSeasonSen: template.priceSuperPeakSeasonSen,
    extHourLowSen: template.extHourLowSen,
    extHourPeakAndSuperPeakSen: template.extHourPeakAndSuperPeakSen,
    deliveryFeeAirportSen: template.deliveryFeeAirportSen,
    deliveryFeeJettySen: template.deliveryFeeJettySen,
    deliveryFeeHotelSen: template.deliveryFeeHotelSen,
    minRentalDays: template.minRentalDays,
    maxRentalDays: template.maxRentalDays,
    availableForBooking: template.availableForBooking,
    slug: null,
    featured: false,
    metaTitle: template.metaTitle,
    metaDescription: template.metaDescription,
    longDescription: template.longDescription,
    highlights: template.highlights,
    bodyType: template.bodyType,
    passengers: template.passengers,
    doors: template.doors,
    transmission: template.transmission,
    fuelType: template.fuelType,
    appleCarPlay: template.appleCarPlay,
    androidAuto: template.androidAuto,
    bootCapacityL: template.bootCapacityL,
    bootCapacityLabel: template.bootCapacityLabel,
    largeSuitcasesCount: template.largeSuitcasesCount,
    smallCarryonsCount: template.smallCarryonsCount,
    combinedCapacityL: template.combinedCapacityL,
    combinedCapacityLabel: template.combinedCapacityLabel,
    tagFunAdventure: template.tagFunAdventure,
    tagFamilyComfort: template.tagFamilyComfort,
    tagSmallOku: template.tagSmallOku,
    ownedByFleet: true,
    vendorName: template.vendorName,
    numberOfUnits: 1,
    overbookUnits: 0,
    promotionalPriceSen: template.promotionalPriceSen,
    lateReturnHourlyFeeSen: template.lateReturnHourlyFeeSen,
    fuelPolicy: template.fuelPolicy,
    carLocations: template.carLocations,
    notes: null,
  }
}

/** Create, update, or retire fleet-owned sibling plates for a make/model group. */
export async function syncCarOwnedUnitsInDb(
  db: Db,
  opts: { carId: string; units: OwnedUnitInput[] },
): Promise<number> {
  if (opts.units.length < 1) {
    throw new Error('At least one owned unit is required.')
  }

  const normalized = opts.units.map((unit) => ({
    carId: unit.carId,
    plateNumber: normalizeOwnedPlate(unit.plateNumber),
    color: unit.color,
    year: validateOwnedUnitYear(unit.year),
  }))

  const plates = normalized.map((unit) => unit.plateNumber)
  if (new Set(plates).size !== plates.length) {
    throw new Error('Each owned unit must have a unique plate number.')
  }

  if (!normalized.some((unit) => unit.carId === opts.carId)) {
    throw new Error('The current vehicle must remain in the owned unit list.')
  }

  const [template] = await db.select().from(cars).where(eq(cars.id, opts.carId)).limit(1)
  if (!template) throw new Error('Vehicle not found.')

  const siblings = await listOwnedSiblingUnits(db, {
    carId: opts.carId,
    make: template.make,
    model: template.model,
  })
  const siblingIds = new Set(siblings.map((row) => row.id))
  const keepIds = new Set(
    normalized.map((unit) => unit.carId).filter((id): id is string => Boolean(id)),
  )

  for (const unit of normalized) {
    if (unit.carId && !siblingIds.has(unit.carId)) {
      throw new Error('Owned unit does not belong to this model.')
    }
  }

  for (const unit of normalized) {
    const conflictConditions = [eq(cars.plateNumber, unit.plateNumber)]
    if (unit.carId) conflictConditions.push(ne(cars.id, unit.carId))
    const [conflict] = await db
      .select({ id: cars.id })
      .from(cars)
      .where(and(...conflictConditions))
      .limit(1)
    if (conflict) {
      throw new Error(`Plate ${unit.plateNumber} is already assigned to another vehicle.`)
    }
  }

  for (const unit of normalized) {
    if (!unit.carId) continue
    const [existing] = await db
      .select({
        plateNumber: cars.plateNumber,
        color: cars.color,
        year: cars.year,
      })
      .from(cars)
      .where(eq(cars.id, unit.carId))
      .limit(1)
    if (
      existing &&
      (existing.plateNumber !== unit.plateNumber ||
        existing.color !== unit.color ||
        existing.year !== unit.year)
    ) {
      await db
        .update(cars)
        .set({
          plateNumber: unit.plateNumber,
          color: unit.color,
          year: unit.year,
          updatedAt: new Date(),
        })
        .where(eq(cars.id, unit.carId))
    }
  }

  for (const unit of normalized) {
    if (unit.carId) continue
    await db.insert(cars).values(siblingInsertFromTemplate(template, unit))
  }

  for (const sibling of siblings) {
    if (keepIds.has(sibling.id)) continue
    const [activeRental] = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.carId, sibling.id),
          or(eq(rentals.status, 'pending'), eq(rentals.status, 'active')),
        ),
      )
      .limit(1)
    if (activeRental) {
      throw new Error(
        `Cannot remove ${sibling.plateNumber}: it has an active or pending rental.`,
      )
    }
    await db
      .update(cars)
      .set({ status: 'retired', updatedAt: new Date() })
      .where(eq(cars.id, sibling.id))
  }

  const unitCount = normalized.length
  await db
    .update(cars)
    .set({ numberOfUnits: unitCount, updatedAt: new Date() })
    .where(eq(cars.id, opts.carId))

  return unitCount
}

/**
 * Replace partner allocations linked to this car, then sync overbookUnits.
 * Creates partner_car_models rows using the listing car's make/model/category.
 */
export async function setCarPartnerAllocationsInDb(
  db: Db,
  opts: {
    carId: string
    rows: PartnerAllocationInput[]
    numberOfUnits?: number
    ownedUnits?: OwnedUnitInput[]
  },
): Promise<CarCapacityBoard> {
  const [car] = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      category: cars.category,
    })
    .from(cars)
    .where(eq(cars.id, opts.carId))
    .limit(1)

  if (!car) throw new Error('Vehicle not found.')

  if (opts.ownedUnits !== undefined) {
    await syncCarOwnedUnitsInDb(db, { carId: opts.carId, units: opts.ownedUnits })
  } else if (opts.numberOfUnits !== undefined) {
    if (!Number.isInteger(opts.numberOfUnits) || opts.numberOfUnits < 1) {
      throw new Error('Owned units must be a whole number of at least 1.')
    }
    await db
      .update(cars)
      .set({ numberOfUnits: opts.numberOfUnits, updatedAt: new Date() })
      .where(eq(cars.id, opts.carId))
  }

  const seenPartners = new Set<string>()
  for (const row of opts.rows) {
    if (seenPartners.has(row.partnerId)) {
      throw new Error('Each partner can only be allocated once on this vehicle.')
    }
    seenPartners.add(row.partnerId)

    if (!Number.isInteger(row.maxUnits) || row.maxUnits < 1) {
      throw new Error('Partner units must be at least 1.')
    }

    const [partner] = await db
      .select({ id: partners.id, status: partners.status })
      .from(partners)
      .where(eq(partners.id, row.partnerId))
      .limit(1)
    if (!partner) throw new Error('Partner not found.')
  }

  const existing = await db
    .select({
      id: partnerCarModels.id,
      partnerId: partnerCarModels.partnerId,
    })
    .from(partnerCarModels)
    .where(eq(partnerCarModels.linkedCarId, opts.carId))

  const keepPartnerIds = new Set(opts.rows.map((r) => r.partnerId))
  const toDelete = existing.filter((row) => !keepPartnerIds.has(row.partnerId))
  for (const row of toDelete) {
    await db.delete(partnerCarModels).where(eq(partnerCarModels.id, row.id))
  }

  for (const row of opts.rows) {
    const matches = existing.filter((e) => e.partnerId === row.partnerId)
    const isActive = row.isActive ?? true
    if (matches.length === 0) {
      await db.insert(partnerCarModels).values({
        partnerId: row.partnerId,
        make: car.make,
        model: car.model,
        category: car.category,
        maxUnits: row.maxUnits,
        linkedCarId: car.id,
        isActive,
      })
      continue
    }

    const [primary, ...dupes] = matches
    await db
      .update(partnerCarModels)
      .set({
        maxUnits: row.maxUnits,
        isActive,
        make: car.make,
        model: car.model,
        category: car.category,
        linkedCarId: car.id,
        updatedAt: new Date(),
      })
      .where(eq(partnerCarModels.id, primary.id))

    for (const dupe of dupes) {
      await db.delete(partnerCarModels).where(eq(partnerCarModels.id, dupe.id))
    }
  }

  await syncCarOverbookUnitsFromPartnerModels(db, opts.carId)

  const board = await buildCarCapacityBoard(db, opts.carId)
  if (!board) throw new Error('Vehicle not found.')
  return board
}
