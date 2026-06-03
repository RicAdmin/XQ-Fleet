import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ne, or, sql } from 'drizzle-orm'

import { carPhotos, cars, rentals } from '#/db/schema'
import type { CarCategory, CarColor } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles } from '#/lib/auth-model'

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
