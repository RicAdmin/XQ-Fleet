import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, notInArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { carPhotos, cars, rentals } from '#/db/schema'
import type { CarCategory, CarColor, CarStatus } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles } from '#/lib/auth-model'
import {
  listCapacitySummariesByMakeModel,
  loadAndSyncCarCapacityBoard,
  ownedUnitCountFromSiblings,
  setCarPartnerAllocationsInDb,
  type CarCapacityBoard,
  type CarCapacityPartnerLine,
  type OwnedCapacityUnit,
} from '#/lib/car-capacity'
import {
  deriveCarDisplayStatus,
  getOverdueCarBuckets,
  type CarDisplayStatus,
  type OverdueCarBuckets,
} from '#/lib/car-display-status'
import { loadCoverPhotoUrlByMakeModel } from '#/lib/car-model-functions'
import {
  adminInputValidator,
  carCategoryFilterSchema,
  paginationSchema,
  sortDirSchema,
  uuidString,
} from '#/lib/validation/admin-schemas'

type CreateCarInput = {
  plateNumber: string
  make: string
  model: string
  year: number
  color: CarColor
  category: CarCategory
  dailyRateSen: number
  notes?: string
  ownedByFleet?: boolean
  availableForBooking?: boolean
}

type UpdateCarInput = {
  carId: string
  plateNumber: string
  make: string
  model: string
  year: number
  color: CarColor
  category: CarCategory
  dailyRateSen: number
  notes?: string
  ownedByFleet?: boolean
  availableForBooking?: boolean
}

type UpdateCarCatalogInput = {
  carId: string
  slug?: string | null
  featured: boolean
  availableForBooking: boolean
  ownedByFleet: boolean
  vendorName?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  longDescription?: string | null
  highlights?: string[] | null
  bodyType?: string | null
  passengers: number
  doors: number
  transmission?: string | null
  fuelType?: string | null
  appleCarPlay: boolean
  androidAuto: boolean
  bootCapacityL?: number | null
  bootCapacityLabel?: string | null
  largeSuitcasesCount?: number | null
  smallCarryonsCount?: number | null
  combinedCapacityL?: number | null
  combinedCapacityLabel?: string | null
  tagFunAdventure: boolean
  tagFamilyComfort: boolean
  tagSmallOku: boolean
  fuelPolicy?: string | null
  carLocations?: string | null
}

type UpdateCarPricingInput = {
  carId: string
  dailyRateSen: number
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
  extHourLowSen: number
  extHourPeakAndSuperPeakSen: number
  deliveryFeeAirportSen: number
  deliveryFeeJettySen: number
  deliveryFeeHotelSen: number
  lateReturnHourlyFeeSen: number
  promotionalPriceSen?: number | null
  minRentalDays: number
  maxRentalDays: number
}

type UpdateCarStatusInput = {
  carId: string
  status: 'maintenance' | 'damaged' | 'available'
}

type UpdateCarFleetCapacityInput = {
  carId: string
  numberOfUnits: number
  overbookUnits: number
}

type RetireCarInput = {
  carId: string
}

type GetCarByIdInput = {
  carId: string
}

function normalizePlate(plate: string) {
  return plate.trim().toUpperCase()
}

function validateCarFields(data: {
  plateNumber: string
  make: string
  model: string
  year: number
  dailyRateSen: number
}) {
  const plateNumber = normalizePlate(data.plateNumber)
  if (!plateNumber) throw new Error('Plate number is required.')
  if (!/^[A-Z0-9 -]+$/.test(plateNumber))
    throw new Error('Plate number contains invalid characters.')

  const make = data.make.trim()
  if (!make) throw new Error('Make is required.')

  const model = data.model.trim()
  if (!model) throw new Error('Model is required.')

  const currentYear = new Date().getFullYear()
  if (data.year < 1960 || data.year > currentYear + 1)
    throw new Error(`Year must be between 1960 and ${currentYear + 1}.`)

  if (data.dailyRateSen < 0) throw new Error('Daily rate cannot be negative.')

  return { ...data, plateNumber, make, model }
}

function validateFleetCapacityFields(data: { numberOfUnits: number; overbookUnits: number }) {
  if (!Number.isInteger(data.numberOfUnits) || data.numberOfUnits < 1) {
    throw new Error('Number of units must be at least 1.')
  }
  if (!Number.isInteger(data.overbookUnits) || data.overbookUnits < 0) {
    throw new Error('Overbook units cannot be negative.')
  }
  return data
}

export const getCars = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(fleetOpsRoles)
  const { db } = await import('#/db')
  return db.select().from(cars).orderBy(desc(cars.createdAt))
})

const carStatusValues = [
  'available',
  'reserved',
  'payment-pending',
  'rented',
  'maintenance',
  'damaged',
  'retired',
] as const satisfies readonly CarStatus[]

export type CarListPartnerCapacity = CarCapacityPartnerLine

export type CarListRow = {
  id: string
  plateNumber: string
  make: string
  model: string
  year: number
  color: CarColor
  category: CarCategory
  status: CarStatus
  /** UI badge status — may be `overdue` without changing DB `status`. */
  displayStatus: CarDisplayStatus
  dailyRateSen: number
  notes: string | null
  ownedByFleet: boolean
  availableForBooking: boolean
  featured: boolean
  coverPhotoUrl: string | null
  ownedCapacityCount: number
  ownedUnits: OwnedCapacityUnit[]
  partnerCapacities: CarListPartnerCapacity[]
  /** Days this car was on rent in the current calendar year (active + closed rentals). */
  rentedDaysYtd: number
  createdAt: Date
  updatedAt: Date
}

export type CarRentedDaysChartEntry = {
  plateNumber: string
  make: string
  model: string
  days: number
  /** Rented days per month (index 0 = January) for the current year. */
  monthlyDays: number[]
  category: CarCategory
  coverPhotoUrl: string | null
}

export type CarListResult = {
  rows: CarListRow[]
  total: number
  page: number
  pageSize: number
  statusCounts: Record<string, number>
  /** Rented-days-YTD for every self-owned car, sorted high to low (for charts). */
  rentedDaysChart: CarRentedDaysChartEntry[]
}

const carStatusFilterValues = [...carStatusValues, 'overdue'] as const

const listCarsSchema = paginationSchema.extend({
  status: z.enum(carStatusFilterValues).optional(),
  category: carCategoryFilterSchema,
  search: z.string().trim().max(120).optional(),
  sortKey: z
    .enum(['plateNumber', 'make', 'year', 'status', 'category', 'dailyRateSen', 'createdAt', 'rentedDaysYtd'])
    .default('plateNumber'),
  sortDir: sortDirSchema,
})

type RentalSpan = { carId: string; startDate: Date; endDate: Date }

function sumRentedDaysYtd(spans: RentalSpan[], yearStart: Date, now: Date) {
  const totals = new Map<string, number>()
  for (const span of spans) {
    const start = span.startDate > yearStart ? span.startDate : yearStart
    const end = span.endDate < now ? span.endDate : now
    const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000))
    totals.set(span.carId, (totals.get(span.carId) ?? 0) + days)
  }
  return totals
}

/** Per-month rented-day breakdown (index 0 = January) for the current year. */
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

async function getCarStatusCounts(overdue: OverdueCarBuckets) {
  const { db } = await import('#/db')
  const rows = await db
    .select({ status: cars.status, count: sql<number>`count(*)::int` })
    .from(cars)
    .groupBy(cars.status)

  const statusCounts: Record<string, number> = { all: 0, overdue: overdue.ids.length }
  for (const row of rows) {
    const n = Number(row.count)
    statusCounts[row.status] = n
    statusCounts.all += n
  }

  // Overdue is display-only — pull those cars out of reserved/rented counts.
  statusCounts.reserved = Math.max(
    0,
    (statusCounts.reserved ?? 0) - overdue.reservedIds.length,
  )
  statusCounts.rented = Math.max(0, (statusCounts.rented ?? 0) - overdue.rentedIds.length)

  return statusCounts
}

export const listCars = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listCarsSchema))
  .handler(async ({ data }): Promise<CarListResult> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    // One overdue bucket fetch for both filter + status counts.
    const overdue = await getOverdueCarBuckets()

    const filters = []
    if (data.status === 'overdue') {
      if (overdue.ids.length === 0) {
        return {
          rows: [],
          total: 0,
          page: data.page,
          pageSize: data.pageSize,
          statusCounts: await getCarStatusCounts(overdue),
          rentedDaysChart: [],
        }
      }
      filters.push(inArray(cars.id, overdue.ids))
    } else if (data.status === 'reserved' || data.status === 'rented') {
      // Match display buckets: exclude cars that show as overdue.
      filters.push(eq(cars.status, data.status))
      if (overdue.ids.length > 0) filters.push(notInArray(cars.id, overdue.ids))
    } else if (data.status) {
      filters.push(eq(cars.status, data.status))
    }
    if (data.category) filters.push(eq(cars.category, data.category))
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(
        or(
          ilike(cars.plateNumber, needle),
          ilike(cars.make, needle),
          ilike(cars.model, needle),
        )!,
      )
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const sortByRentedDays = data.sortKey === 'rentedDaysYtd'

    const sortColumn = {
      plateNumber: cars.plateNumber,
      make: cars.make,
      year: cars.year,
      status: cars.status,
      category: cars.category,
      dailyRateSen: cars.dailyRateSen,
      createdAt: cars.createdAt,
      // rentedDaysYtd is computed in JS — fall back to plate for the DB ordering.
      rentedDaysYtd: cars.plateNumber,
    }[data.sortKey]

    const orderBy = data.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db.select().from(cars)
    const filteredQuery = whereClause ? baseQuery.where(whereClause) : baseQuery
    // Sorting by rented days needs the full filtered set before slicing.
    const rowsPromise = sortByRentedDays
      ? filteredQuery.orderBy(asc(cars.plateNumber))
      : filteredQuery.orderBy(orderBy).limit(data.pageSize).offset(offset)

    const countBase = db.select({ count: sql<number>`count(*)::int` }).from(cars)
    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult, statusCounts] = await Promise.all([
      rowsPromise,
      countPromise,
      getCarStatusCounts(overdue),
    ])

    const carIds = rows.map((row) => row.id)
    const openRentals =
      carIds.length === 0
        ? []
        : await db
            .select({
              carId: rentals.carId,
              status: rentals.status,
              startDate: rentals.startDate,
              endDate: rentals.endDate,
            })
            .from(rentals)
            .where(
              and(
                inArray(rentals.carId, carIds),
                inArray(rentals.status, ['pending', 'active']),
              ),
            )

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
      rows.map((row) => ({ make: row.make, model: row.model })),
    )

    const openByCarId = new Map<
      string,
      { status: string; startDate: Date; endDate: Date }
    >()
    for (const rental of openRentals) {
      const existing = openByCarId.get(rental.carId)
      // Prefer active over pending when both somehow exist for one car.
      if (!existing || (existing.status !== 'active' && rental.status === 'active')) {
        openByCarId.set(rental.carId, rental)
      }
    }

    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const rentedSpans =
      carIds.length === 0
        ? []
        : await db
            .select({
              carId: rentals.carId,
              startDate: rentals.startDate,
              endDate: rentals.endDate,
            })
            .from(rentals)
            .where(
              and(
                inArray(rentals.carId, carIds),
                inArray(rentals.status, ['active', 'closed']),
                lte(rentals.startDate, now),
                gte(rentals.endDate, yearStart),
              ),
            )
    const rentedDaysByCarId = sumRentedDaysYtd(rentedSpans, yearStart, now)

    // Chart dataset: rented days YTD across all self-owned cars (page-independent).
    const ownedFleetCars = await db
      .select({
        id: cars.id,
        plateNumber: cars.plateNumber,
        make: cars.make,
        model: cars.model,
        category: cars.category,
      })
      .from(cars)
      .where(eq(cars.ownedByFleet, true))
    const ownedIds = ownedFleetCars.map((row) => row.id)
    const ownedSpans =
      ownedIds.length === 0
        ? []
        : await db
            .select({
              carId: rentals.carId,
              startDate: rentals.startDate,
              endDate: rentals.endDate,
            })
            .from(rentals)
            .where(
              and(
                inArray(rentals.carId, ownedIds),
                inArray(rentals.status, ['active', 'closed']),
                lte(rentals.startDate, now),
                gte(rentals.endDate, yearStart),
              ),
            )
    const ownedDaysByCarId = sumRentedDaysYtd(ownedSpans, yearStart, now)
    const ownedMonthlyByCarId = monthlyRentedDaysYtd(ownedSpans, yearStart, now)
    const ownedCovers =
      ownedIds.length === 0
        ? []
        : await db
            .select({ carId: carPhotos.carId, url: carPhotos.url })
            .from(carPhotos)
            .where(and(inArray(carPhotos.carId, ownedIds), eq(carPhotos.isCover, true)))
    const ownedCoverByCarId = new Map(ownedCovers.map((photo) => [photo.carId, photo.url]))
    const ownedCoverByMakeModel = await loadCoverPhotoUrlByMakeModel(
      db,
      ownedFleetCars.map((row) => ({ make: row.make, model: row.model })),
    )
    const rentedDaysChart: CarRentedDaysChartEntry[] = ownedFleetCars
      .map((row) => {
        const capacityKey = `${row.make.toLowerCase()}\0${row.model.toLowerCase()}`
        return {
          plateNumber: row.plateNumber,
          make: row.make,
          model: row.model,
          days: ownedDaysByCarId.get(row.id) ?? 0,
          monthlyDays:
            ownedMonthlyByCarId.get(row.id) ?? Array.from({ length: 12 }, () => 0),
          category: row.category,
          coverPhotoUrl:
            ownedCoverByCarId.get(row.id) ?? ownedCoverByMakeModel.get(capacityKey) ?? null,
        }
      })
      .sort((a, b) => b.days - a.days)

    const capacityByMakeModel = await listCapacitySummariesByMakeModel(db, rows)
    let enrichedRows: CarListRow[] = rows.map((row) => {
      const capacityKey = `${row.make.toLowerCase()}\0${row.model.toLowerCase()}`
      const capacity = capacityByMakeModel.get(capacityKey) ?? {
        ownedCount: ownedUnitCountFromSiblings(0),
        ownedUnits: [],
        partners: [],
      }

      return {
        ...row,
        coverPhotoUrl:
          coverByCarId.get(row.id) ?? coverByMakeModel.get(capacityKey) ?? null,
        displayStatus: deriveCarDisplayStatus(row.status, openByCarId.get(row.id), now),
        ownedCapacityCount: capacity.ownedCount,
        ownedUnits: capacity.ownedUnits,
        partnerCapacities: capacity.partners,
        rentedDaysYtd: rentedDaysByCarId.get(row.id) ?? 0,
      }
    })

    if (sortByRentedDays) {
      enrichedRows.sort((a, b) =>
        data.sortDir === 'asc'
          ? a.rentedDaysYtd - b.rentedDaysYtd
          : b.rentedDaysYtd - a.rentedDaysYtd,
      )
      enrichedRows = enrichedRows.slice(offset, offset + data.pageSize)
    }

    return {
      rows: enrichedRows,
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
      statusCounts,
      rentedDaysChart,
    }
  })

export const getCarById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetCarByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const results = await db
      .select()
      .from(cars)
      .where(eq(cars.id, data.carId))
      .limit(1)
    return results[0] ?? null
  })

export const createCar = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateCarInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const validated = validateCarFields(data)

    const { db } = await import('#/db')
    const existing = await db
      .select({ id: cars.id })
      .from(cars)
      .where(eq(cars.plateNumber, validated.plateNumber))
      .limit(1)

    if (existing.length > 0)
      throw new Error(
        `A vehicle with plate number ${validated.plateNumber} already exists.`,
      )

    const result = await db
      .insert(cars)
      .values({
        plateNumber: validated.plateNumber,
        make: validated.make,
        model: validated.model,
        year: validated.year,
        color: data.color,
        category: data.category,
        dailyRateSen: validated.dailyRateSen,
        notes: data.notes ?? null,
        ownedByFleet: data.ownedByFleet ?? true,
        availableForBooking: data.availableForBooking ?? true,
        status: 'available',
      })
      .returning()

    return result[0]
  })

export const updateCar = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCarInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const validated = validateCarFields(data)

    const { db } = await import('#/db')
    const existing = await db
      .select({ id: cars.id })
      .from(cars)
      .where(
        and(eq(cars.plateNumber, validated.plateNumber), ne(cars.id, data.carId)),
      )
      .limit(1)

    if (existing.length > 0)
      throw new Error(
        `A vehicle with plate number ${validated.plateNumber} already exists.`,
      )

    const result = await db
      .update(cars)
      .set({
        plateNumber: validated.plateNumber,
        make: validated.make,
        model: validated.model,
        year: validated.year,
        color: data.color,
        category: data.category,
        dailyRateSen: validated.dailyRateSen,
        notes: data.notes ?? null,
        ...(data.ownedByFleet !== undefined ? { ownedByFleet: data.ownedByFleet } : {}),
        ...(data.availableForBooking !== undefined
          ? { availableForBooking: data.availableForBooking }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(cars.id, data.carId))
      .returning()

    if (!result[0]) throw new Error('Vehicle not found.')
    return result[0]
  })

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export const updateCarCatalog = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCarCatalogInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    if (data.passengers < 1 || data.passengers > 20) {
      throw new Error('Passengers must be between 1 and 20.')
    }
    if (data.doors < 2 || data.doors > 6) {
      throw new Error('Doors must be between 2 and 6.')
    }

    const slug = emptyToNull(data.slug)
    const { db } = await import('#/db')

    if (slug) {
      const conflict = await db
        .select({ id: cars.id })
        .from(cars)
        .where(and(eq(cars.slug, slug), ne(cars.id, data.carId)))
        .limit(1)
      if (conflict.length > 0) {
        throw new Error(`Slug "${slug}" is already used by another vehicle.`)
      }
    }

    const result = await db
      .update(cars)
      .set({
        slug,
        featured: data.featured,
        availableForBooking: data.availableForBooking,
        ownedByFleet: data.ownedByFleet,
        vendorName: emptyToNull(data.vendorName),
        metaTitle: emptyToNull(data.metaTitle),
        metaDescription: emptyToNull(data.metaDescription),
        longDescription: emptyToNull(data.longDescription),
        highlights: data.highlights?.length ? data.highlights : null,
        bodyType: emptyToNull(data.bodyType),
        passengers: data.passengers,
        doors: data.doors,
        transmission: emptyToNull(data.transmission),
        fuelType: emptyToNull(data.fuelType),
        appleCarPlay: data.appleCarPlay,
        androidAuto: data.androidAuto,
        bootCapacityL: data.bootCapacityL ?? null,
        bootCapacityLabel: emptyToNull(data.bootCapacityLabel),
        largeSuitcasesCount: data.largeSuitcasesCount ?? null,
        smallCarryonsCount: data.smallCarryonsCount ?? null,
        combinedCapacityL: data.combinedCapacityL ?? null,
        combinedCapacityLabel: emptyToNull(data.combinedCapacityLabel),
        tagFunAdventure: data.tagFunAdventure,
        tagFamilyComfort: data.tagFamilyComfort,
        tagSmallOku: data.tagSmallOku,
        fuelPolicy: emptyToNull(data.fuelPolicy),
        carLocations: emptyToNull(data.carLocations),
        updatedAt: new Date(),
      })
      .where(eq(cars.id, data.carId))
      .returning()

    if (!result[0]) throw new Error('Vehicle not found.')
    return result[0]
  })

function assertNonNegativeSen(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} cannot be negative.`)
  }
}

export const updateCarPricing = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCarPricingInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)

    assertNonNegativeSen(data.dailyRateSen, 'Daily rate')
    assertNonNegativeSen(data.priceLowSeasonSen, 'Low-season price')
    assertNonNegativeSen(data.pricePeakSeasonSen, 'Peak-season price')
    assertNonNegativeSen(data.priceSuperPeakSeasonSen, 'Super-peak price')
    assertNonNegativeSen(data.extHourLowSen, 'Extension hour (low)')
    assertNonNegativeSen(data.extHourPeakAndSuperPeakSen, 'Extension hour (peak)')
    assertNonNegativeSen(data.deliveryFeeAirportSen, 'Airport delivery fee')
    assertNonNegativeSen(data.deliveryFeeJettySen, 'Jetty delivery fee')
    assertNonNegativeSen(data.deliveryFeeHotelSen, 'Hotel delivery fee')
    assertNonNegativeSen(data.lateReturnHourlyFeeSen, 'Late return fee')
    if (data.promotionalPriceSen != null) {
      assertNonNegativeSen(data.promotionalPriceSen, 'Promotional price')
    }
    if (!Number.isInteger(data.minRentalDays) || data.minRentalDays < 1) {
      throw new Error('Minimum rental days must be at least 1.')
    }
    if (!Number.isInteger(data.maxRentalDays) || data.maxRentalDays < data.minRentalDays) {
      throw new Error('Maximum rental days must be >= minimum.')
    }

    const { db } = await import('#/db')
    const result = await db
      .update(cars)
      .set({
        dailyRateSen: data.dailyRateSen,
        priceLowSeasonSen: data.priceLowSeasonSen,
        pricePeakSeasonSen: data.pricePeakSeasonSen,
        priceSuperPeakSeasonSen: data.priceSuperPeakSeasonSen,
        extHourLowSen: data.extHourLowSen,
        extHourPeakAndSuperPeakSen: data.extHourPeakAndSuperPeakSen,
        deliveryFeeAirportSen: data.deliveryFeeAirportSen,
        deliveryFeeJettySen: data.deliveryFeeJettySen,
        deliveryFeeHotelSen: data.deliveryFeeHotelSen,
        lateReturnHourlyFeeSen: data.lateReturnHourlyFeeSen,
        promotionalPriceSen: data.promotionalPriceSen ?? null,
        minRentalDays: data.minRentalDays,
        maxRentalDays: data.maxRentalDays,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, data.carId))
      .returning()

    if (!result[0]) throw new Error('Vehicle not found.')
    return result[0]
  })

export const updateCarFleetCapacity = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCarFleetCapacityInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const validated = validateFleetCapacityFields(data)

    const { db } = await import('#/db')
    const result = await db
      .update(cars)
      .set({
        numberOfUnits: validated.numberOfUnits,
        overbookUnits: validated.overbookUnits,
        updatedAt: new Date(),
      })
      .where(eq(cars.id, data.carId))
      .returning()

    if (!result[0]) throw new Error('Vehicle not found.')
    return result[0]
  })

const carIdSchema = z.object({ carId: uuidString })

export type { CarCapacityBoard }

export const getCarCapacityBoard = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(carIdSchema))
  .handler(async ({ data }): Promise<CarCapacityBoard> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const board = await loadAndSyncCarCapacityBoard(db, data.carId)
    if (!board) throw new Error('Vehicle not found.')
    return board
  })

const setCarPartnerAllocationsSchema = z.object({
  carId: uuidString,
  numberOfUnits: z.number().int().min(1).max(500).optional(),
  ownedUnits: z
    .array(
      z.object({
        carId: uuidString.optional(),
        plateNumber: z.string().trim().min(1).max(32),
        color: z.enum([
          'white',
          'black',
          'silver',
          'grey',
          'red',
          'blue',
          'dark-blue',
          'maroon',
          'gold',
          'beige',
          'green',
          'other',
        ]),
        year: z.number().int().min(1960).max(2100),
      }),
    )
    .min(1)
    .max(500)
    .optional(),
  rows: z
    .array(
      z.object({
        partnerId: uuidString,
        maxUnits: z.number().int().min(1).max(500),
        isActive: z.boolean().optional(),
      }),
    )
    .max(50),
})

export const setCarPartnerAllocations = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(setCarPartnerAllocationsSchema))
  .handler(async ({ data }): Promise<CarCapacityBoard> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    return setCarPartnerAllocationsInDb(db, {
      carId: data.carId,
      numberOfUnits: data.numberOfUnits,
      ownedUnits: data.ownedUnits,
      rows: data.rows,
    })
  })

export const updateCarStatus = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCarStatusInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)

    const { db } = await import('#/db')
    const current = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, data.carId))
      .limit(1)

    if (!current[0]) throw new Error('Vehicle not found.')
    const lockedStatuses = ['retired', 'rented', 'reserved', 'payment-pending'] as const
    if ((lockedStatuses as readonly string[]).includes(current[0].status))
      throw new Error(`Cannot manually change status of a vehicle that is ${current[0].status}.`)

    const result = await db
      .update(cars)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(cars.id, data.carId))
      .returning()

    return result[0]
  })

export const retireCar = createServerFn({ method: 'POST' })
  .inputValidator((input: RetireCarInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)

    const { db } = await import('#/db')
    const activeRentals = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(
        and(
          eq(rentals.carId, data.carId),
          or(eq(rentals.status, 'pending'), eq(rentals.status, 'active')),
        ),
      )
      .limit(1)

    if (activeRentals.length > 0)
      throw new Error('Cannot retire a vehicle with active or pending rentals.')

    const result = await db
      .update(cars)
      .set({ status: 'retired', updatedAt: new Date() })
      .where(eq(cars.id, data.carId))
      .returning()

    if (!result[0]) throw new Error('Vehicle not found.')
    return result[0]
  })

// ─── Car Photo Server Functions ───────────────────────────────────────────────

export type CarPhotoRow = {
  id: string
  carId: string
  url: string
  altText: string | null
  sortOrder: number
  isCover: boolean
  createdAt: Date
}

type GetCarPhotosInput = { carId: string }

export const getCarPhotos = createServerFn({ method: 'GET' })
  .inputValidator((input: GetCarPhotosInput) => input)
  .handler(async ({ data }): Promise<CarPhotoRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    return db
      .select()
      .from(carPhotos)
      .where(eq(carPhotos.carId, data.carId))
      .orderBy(carPhotos.sortOrder)
  })

type GeneratePresignedUrlInput = {
  carId: string
  fileName: string
  contentType: string
}

export const generatePresignedUrl = createServerFn({ method: 'POST' })
  .inputValidator((input: GeneratePresignedUrlInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    const [car] = await db.select({ id: cars.id }).from(cars).where(eq(cars.id, data.carId)).limit(1)
    if (!car) throw new Error('Vehicle not found.')

    const { getPresignedPutUrl, getPublicUrl } = await import('#/integrations/cloudflare-r2')
    const key = `cars/${data.carId}/${Date.now()}-${data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const presignedUrl = await getPresignedPutUrl(key, data.contentType)
    return { presignedUrl, key, publicUrl: getPublicUrl(key) }
  })

type SaveCarPhotoInput = {
  carId: string
  url: string
  key: string
}

export const saveCarPhoto = createServerFn({ method: 'POST' })
  .inputValidator((input: SaveCarPhotoInput) => input)
  .handler(async ({ data }): Promise<CarPhotoRow> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const [maxRow] = await db
      .select({ max: sql<number>`COALESCE(MAX(${carPhotos.sortOrder}), -1)` })
      .from(carPhotos)
      .where(eq(carPhotos.carId, data.carId))

    const nextOrder = (maxRow?.max ?? -1) + 1

    // First photo automatically becomes cover
    const [existingCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(carPhotos)
      .where(eq(carPhotos.carId, data.carId))
    const isFirst = (existingCount?.count ?? 0) === 0

    const [result] = await db
      .insert(carPhotos)
      .values({ carId: data.carId, url: data.url, sortOrder: nextOrder, isCover: isFirst })
      .returning()

    if (!result) throw new Error('Failed to save photo.')
    return result
  })

type ReorderPhotosInput = {
  carId: string
  photoIds: string[]
}

export const reorderPhotos = createServerFn({ method: 'POST' })
  .inputValidator((input: ReorderPhotosInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    await Promise.all(
      data.photoIds.map((photoId, index) =>
        db
          .update(carPhotos)
          .set({ sortOrder: index })
          .where(and(eq(carPhotos.id, photoId), eq(carPhotos.carId, data.carId))),
      ),
    )
    return { success: true }
  })

type SetCoverPhotoInput = {
  carId: string
  photoId: string
}

export const setCoverPhoto = createServerFn({ method: 'POST' })
  .inputValidator((input: SetCoverPhotoInput) => input)
  .handler(async ({ data }): Promise<CarPhotoRow> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    await db.update(carPhotos).set({ isCover: false }).where(eq(carPhotos.carId, data.carId))
    const [result] = await db
      .update(carPhotos)
      .set({ isCover: true })
      .where(and(eq(carPhotos.id, data.photoId), eq(carPhotos.carId, data.carId)))
      .returning()
    if (!result) throw new Error('Photo not found.')
    return result
  })

type DeleteCarPhotoInput = {
  carId: string
  photoId: string
}

export const deleteCarPhoto = createServerFn({ method: 'POST' })
  .inputValidator((input: DeleteCarPhotoInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const [photo] = await db
      .select({ url: carPhotos.url })
      .from(carPhotos)
      .where(and(eq(carPhotos.id, data.photoId), eq(carPhotos.carId, data.carId)))
      .limit(1)

    if (!photo) throw new Error('Photo not found.')

    await db
      .delete(carPhotos)
      .where(and(eq(carPhotos.id, data.photoId), eq(carPhotos.carId, data.carId)))

    // Best-effort R2 deletion (URL contains the key after R2_PUBLIC_URL/)
    try {
      const { deleteR2Object } = await import('#/integrations/cloudflare-r2')
      const publicBase = process.env.R2_PUBLIC_URL ?? ''
      const key = photo.url.startsWith(publicBase) ? photo.url.slice(publicBase.length + 1) : null
      if (key) await deleteR2Object(key)
    } catch {
      // Non-fatal: DB row is already deleted
    }

    return { success: true }
  })
