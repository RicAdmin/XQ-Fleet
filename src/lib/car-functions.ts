import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ne, or } from 'drizzle-orm'

import { cars, rentals } from '#/db/schema'
import type { CarCategory, CarColor } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'

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
  await requireRole(['owner', 'staff'])
  const { db } = await import('#/db')
  return db.select().from(cars).orderBy(desc(cars.createdAt))
})

export const getCarById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetCarByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner', 'staff'])
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
    await requireRole(['owner'])
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
    await requireRole(['owner'])
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
    await requireRole(['owner'])

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
    await requireRole(['owner'])

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
