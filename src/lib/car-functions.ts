import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, inArray, ne, notInArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { carPhotos, cars, rentals } from '#/db/schema'
import type { CarCategory, CarColor, CarStatus } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles } from '#/lib/auth-model'
import {
  deriveCarDisplayStatus,
  getOverdueCarBuckets,
  type CarDisplayStatus,
  type OverdueCarBuckets,
} from '#/lib/car-display-status'
import {
  adminInputValidator,
  carCategoryFilterSchema,
  paginationSchema,
  sortDirSchema,
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
}

type UpdateCarStatusInput = {
  carId: string
  status: 'maintenance' | 'damaged' | 'available'
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
  createdAt: Date
  updatedAt: Date
}

export type CarListResult = {
  rows: CarListRow[]
  total: number
  page: number
  pageSize: number
  statusCounts: Record<string, number>
}

const carStatusFilterValues = [...carStatusValues, 'overdue'] as const

const listCarsSchema = paginationSchema.extend({
  status: z.enum(carStatusFilterValues).optional(),
  category: carCategoryFilterSchema,
  search: z.string().trim().max(120).optional(),
  sortKey: z
    .enum(['plateNumber', 'make', 'year', 'status', 'category', 'dailyRateSen', 'createdAt'])
    .default('plateNumber'),
  sortDir: sortDirSchema,
})

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

    const sortColumn = {
      plateNumber: cars.plateNumber,
      make: cars.make,
      year: cars.year,
      status: cars.status,
      category: cars.category,
      dailyRateSen: cars.dailyRateSen,
      createdAt: cars.createdAt,
    }[data.sortKey]

    const orderBy = data.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db.select().from(cars)
    const rowsPromise = whereClause
      ? baseQuery.where(whereClause).orderBy(orderBy).limit(data.pageSize).offset(offset)
      : baseQuery.orderBy(orderBy).limit(data.pageSize).offset(offset)

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
    const enrichedRows: CarListRow[] = rows.map((row) => ({
      ...row,
      displayStatus: deriveCarDisplayStatus(row.status, openByCarId.get(row.id), now),
    }))

    return {
      rows: enrichedRows,
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
      statusCounts,
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
        updatedAt: new Date(),
      })
      .where(eq(cars.id, data.carId))
      .returning()

    if (!result[0]) throw new Error('Vehicle not found.')
    return result[0]
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
