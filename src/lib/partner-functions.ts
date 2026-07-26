import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { cars, partnerCarModels, partners } from '#/db/schema'
import type { CarCategory, PartnerStatus } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fullAdminRoles } from '#/lib/auth-model'
import { syncCarOverbookUnitsFromPartnerModels } from '#/lib/car-capacity'
import {
  adminInputValidator,
  optionalTrimmedString,
  paginationSchema,
  sortDirSchema,
  trimmedString,
  uuidString,
} from '#/lib/validation/admin-schemas'

const partnerStatusSchema = z.enum(['active', 'inactive'])
const carCategorySchema = z.enum(['economy', 'mpv', 'suv', 'other'])

export function formatPartnerCode(code: string) {
  return code.trim().toUpperCase()
}

function normalizePartnerCode(code: string) {
  return formatPartnerCode(code)
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── Partners ─────────────────────────────────────────────────────────────────

const createPartnerSchema = z.object({
  name: trimmedString(120),
  code: trimmedString(40),
  contactPerson: optionalTrimmedString(120),
  phone: optionalTrimmedString(40),
  email: optionalTrimmedString(160),
  status: partnerStatusSchema.default('active'),
  notes: optionalTrimmedString(2000),
})

export const createPartner = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(createPartnerSchema))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const code = normalizePartnerCode(data.code)
    if (!code) throw new Error('Partner code is required.')

    const email = data.email
    if (email && !email.includes('@')) throw new Error('Enter a valid email.')

    const { db } = await import('#/db')
    const existing = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.code, code))
      .limit(1)
    if (existing.length > 0) {
      throw new Error(`Partner code "${code}" is already in use.`)
    }

    const [row] = await db
      .insert(partners)
      .values({
        name: data.name,
        code,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: email ?? null,
        status: data.status,
        notes: data.notes ?? null,
      })
      .returning()

    return row
  })

const updatePartnerSchema = createPartnerSchema.extend({
  partnerId: uuidString,
})

export const updatePartner = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(updatePartnerSchema))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const code = normalizePartnerCode(data.code)
    if (!code) throw new Error('Partner code is required.')

    const email = data.email
    if (email && !email.includes('@')) throw new Error('Enter a valid email.')

    const { db } = await import('#/db')
    const conflict = await db
      .select({ id: partners.id })
      .from(partners)
      .where(and(eq(partners.code, code), ne(partners.id, data.partnerId)))
      .limit(1)
    if (conflict.length > 0) {
      throw new Error(`Partner code "${code}" is already in use.`)
    }

    const [row] = await db
      .update(partners)
      .set({
        name: data.name,
        code,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        email: email ?? null,
        status: data.status,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, data.partnerId))
      .returning()

    if (!row) throw new Error('Partner not found.')
    return row
  })

const deletePartnerSchema = z.object({ partnerId: uuidString })

export const deletePartner = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(deletePartnerSchema))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    const [row] = await db
      .delete(partners)
      .where(eq(partners.id, data.partnerId))
      .returning({ id: partners.id })
    if (!row) throw new Error('Partner not found.')
    return { success: true as const }
  })

export type PartnerListModelLine = {
  make: string
  model: string
  maxUnits: number
}

export type PartnerListRow = {
  id: string
  name: string
  code: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  status: PartnerStatus
  notes: string | null
  modelCount: number
  modelLines: PartnerListModelLine[]
  createdAt: Date
  updatedAt: Date
}

export type PartnerListResult = {
  rows: PartnerListRow[]
  total: number
  page: number
  pageSize: number
}

const listPartnersSchema = paginationSchema.extend({
  status: partnerStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
  sortKey: z.enum(['name', 'code', 'status', 'createdAt']).default('name'),
  sortDir: sortDirSchema,
})

export const listPartners = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listPartnersSchema))
  .handler(async ({ data }): Promise<PartnerListResult> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const filters = []
    if (data.status) filters.push(eq(partners.status, data.status))
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(
        or(
          ilike(partners.name, needle),
          ilike(partners.code, needle),
          ilike(partners.email, needle),
          ilike(partners.contactPerson, needle),
        )!,
      )
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const sortColumn = {
      name: partners.name,
      code: partners.code,
      status: partners.status,
      createdAt: partners.createdAt,
    }[data.sortKey]
    const orderBy = data.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const modelCountExpr = sql<number>`(
      SELECT COUNT(*)::int FROM ${partnerCarModels}
      WHERE ${partnerCarModels.partnerId} = ${partners.id}
    )`

    const base = db
      .select({
        id: partners.id,
        name: partners.name,
        code: partners.code,
        contactPerson: partners.contactPerson,
        phone: partners.phone,
        email: partners.email,
        status: partners.status,
        notes: partners.notes,
        modelCount: modelCountExpr,
        createdAt: partners.createdAt,
        updatedAt: partners.updatedAt,
      })
      .from(partners)

    const rowsPromise = whereClause
      ? base.where(whereClause).orderBy(orderBy).limit(data.pageSize).offset(offset)
      : base.orderBy(orderBy).limit(data.pageSize).offset(offset)

    const countBase = db.select({ count: count() }).from(partners)
    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise])

    const partnerIds = rows.map((row) => row.id)
    const modelRows =
      partnerIds.length === 0
        ? []
        : await db
            .select({
              partnerId: partnerCarModels.partnerId,
              make: partnerCarModels.make,
              model: partnerCarModels.model,
              maxUnits: partnerCarModels.maxUnits,
              isActive: partnerCarModels.isActive,
            })
            .from(partnerCarModels)
            .where(inArray(partnerCarModels.partnerId, partnerIds))
            .orderBy(asc(partnerCarModels.make), asc(partnerCarModels.model))

    const modelLinesByPartner = new Map<string, PartnerListModelLine[]>()
    for (const modelRow of modelRows) {
      if (!modelRow.isActive) continue
      const existing = modelLinesByPartner.get(modelRow.partnerId) ?? []
      existing.push({
        make: modelRow.make,
        model: modelRow.model,
        maxUnits: Math.max(0, Math.floor(Number(modelRow.maxUnits) || 0)),
      })
      modelLinesByPartner.set(modelRow.partnerId, existing)
    }

    return {
      rows: rows.map((row) => ({
        ...row,
        modelCount: Number(row.modelCount ?? 0),
        modelLines: modelLinesByPartner.get(row.id) ?? [],
      })),
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
    }
  })

export type PartnerModelRow = {
  id: string
  partnerId: string
  make: string
  model: string
  category: CarCategory
  yearFrom: number | null
  yearTo: number | null
  maxUnits: number
  wholesaleDailySen: number | null
  leadTimeHours: number | null
  linkedCarId: string | null
  linkedCarPlate: string | null
  linkedCarLabel: string | null
  isActive: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type PartnerDetail = {
  partner: {
    id: string
    name: string
    code: string
    contactPerson: string | null
    phone: string | null
    email: string | null
    status: PartnerStatus
    notes: string | null
    createdAt: Date
    updatedAt: Date
  }
  models: PartnerModelRow[]
}

const getPartnerDetailSchema = z.object({ partnerId: uuidString })

export const getPartnerDetail = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(getPartnerDetailSchema))
  .handler(async ({ data }): Promise<PartnerDetail | null> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, data.partnerId))
      .limit(1)
    if (!partner) return null

    const models = await db
      .select({
        id: partnerCarModels.id,
        partnerId: partnerCarModels.partnerId,
        make: partnerCarModels.make,
        model: partnerCarModels.model,
        category: partnerCarModels.category,
        yearFrom: partnerCarModels.yearFrom,
        yearTo: partnerCarModels.yearTo,
        maxUnits: partnerCarModels.maxUnits,
        wholesaleDailySen: partnerCarModels.wholesaleDailySen,
        leadTimeHours: partnerCarModels.leadTimeHours,
        linkedCarId: partnerCarModels.linkedCarId,
        linkedCarPlate: cars.plateNumber,
        linkedCarMake: cars.make,
        linkedCarModel: cars.model,
        isActive: partnerCarModels.isActive,
        notes: partnerCarModels.notes,
        createdAt: partnerCarModels.createdAt,
        updatedAt: partnerCarModels.updatedAt,
      })
      .from(partnerCarModels)
      .leftJoin(cars, eq(partnerCarModels.linkedCarId, cars.id))
      .where(eq(partnerCarModels.partnerId, data.partnerId))
      .orderBy(asc(partnerCarModels.make), asc(partnerCarModels.model))

    return {
      partner,
      models: models.map((row) => ({
        id: row.id,
        partnerId: row.partnerId,
        make: row.make,
        model: row.model,
        category: row.category,
        yearFrom: row.yearFrom,
        yearTo: row.yearTo,
        maxUnits: row.maxUnits,
        wholesaleDailySen: row.wholesaleDailySen,
        leadTimeHours: row.leadTimeHours,
        linkedCarId: row.linkedCarId,
        linkedCarPlate: row.linkedCarPlate,
        linkedCarLabel:
          row.linkedCarMake && row.linkedCarModel
            ? `${row.linkedCarMake} ${row.linkedCarModel}`
            : null,
        isActive: row.isActive,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    }
  })

// ─── Partner car models ───────────────────────────────────────────────────────

const partnerModelBaseSchema = z.object({
  make: trimmedString(80),
  model: trimmedString(80),
  category: carCategorySchema.default('other'),
  yearFrom: z.number().int().min(1960).max(2100).optional().nullable(),
  yearTo: z.number().int().min(1960).max(2100).optional().nullable(),
  maxUnits: z.number().int().min(1).max(500).default(1),
  wholesaleDailySen: z.number().int().min(0).optional().nullable(),
  leadTimeHours: z.number().int().min(0).max(24 * 30).optional().nullable(),
  linkedCarId: uuidString.optional().nullable(),
  isActive: z.boolean().default(true),
  notes: optionalTrimmedString(2000),
})

const createPartnerModelSchema = partnerModelBaseSchema.extend({
  partnerId: uuidString,
})

export const createPartnerCarModel = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(createPartnerModelSchema))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    if (
      data.yearFrom != null &&
      data.yearTo != null &&
      data.yearTo < data.yearFrom
    ) {
      throw new Error('Year to must be >= year from.')
    }

    const { db } = await import('#/db')
    const [partner] = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.id, data.partnerId))
      .limit(1)
    if (!partner) throw new Error('Partner not found.')

    if (data.linkedCarId) {
      const [car] = await db
        .select({ id: cars.id })
        .from(cars)
        .where(eq(cars.id, data.linkedCarId))
        .limit(1)
      if (!car) throw new Error('Linked vehicle not found.')
    }

    const [row] = await db
      .insert(partnerCarModels)
      .values({
        partnerId: data.partnerId,
        make: data.make,
        model: data.model,
        category: data.category,
        yearFrom: data.yearFrom ?? null,
        yearTo: data.yearTo ?? null,
        maxUnits: data.maxUnits,
        wholesaleDailySen: data.wholesaleDailySen ?? null,
        leadTimeHours: data.leadTimeHours ?? null,
        linkedCarId: data.linkedCarId ?? null,
        isActive: data.isActive,
        notes: data.notes ?? null,
      })
      .returning()

    if (row.linkedCarId) {
      await syncCarOverbookUnitsFromPartnerModels(db, row.linkedCarId)
    }

    return row
  })

const updatePartnerModelSchema = partnerModelBaseSchema.extend({
  modelId: uuidString,
})

export const updatePartnerCarModel = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(updatePartnerModelSchema))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    if (
      data.yearFrom != null &&
      data.yearTo != null &&
      data.yearTo < data.yearFrom
    ) {
      throw new Error('Year to must be >= year from.')
    }

    const { db } = await import('#/db')
    const [existing] = await db
      .select({
        id: partnerCarModels.id,
        linkedCarId: partnerCarModels.linkedCarId,
      })
      .from(partnerCarModels)
      .where(eq(partnerCarModels.id, data.modelId))
      .limit(1)
    if (!existing) throw new Error('Partner car model not found.')

    if (data.linkedCarId) {
      const [car] = await db
        .select({ id: cars.id })
        .from(cars)
        .where(eq(cars.id, data.linkedCarId))
        .limit(1)
      if (!car) throw new Error('Linked vehicle not found.')
    }

    const [row] = await db
      .update(partnerCarModels)
      .set({
        make: data.make,
        model: data.model,
        category: data.category,
        yearFrom: data.yearFrom ?? null,
        yearTo: data.yearTo ?? null,
        maxUnits: data.maxUnits,
        wholesaleDailySen: data.wholesaleDailySen ?? null,
        leadTimeHours: data.leadTimeHours ?? null,
        linkedCarId: data.linkedCarId ?? null,
        isActive: data.isActive,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(partnerCarModels.id, data.modelId))
      .returning()

    if (!row) throw new Error('Partner car model not found.')

    const affectedCarIds = new Set<string>()
    if (existing.linkedCarId) affectedCarIds.add(existing.linkedCarId)
    if (row.linkedCarId) affectedCarIds.add(row.linkedCarId)
    for (const carId of affectedCarIds) {
      await syncCarOverbookUnitsFromPartnerModels(db, carId)
    }

    return row
  })

const deletePartnerModelSchema = z.object({ modelId: uuidString })

export const deletePartnerCarModel = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(deletePartnerModelSchema))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    const [row] = await db
      .delete(partnerCarModels)
      .where(eq(partnerCarModels.id, data.modelId))
      .returning({
        id: partnerCarModels.id,
        linkedCarId: partnerCarModels.linkedCarId,
      })
    if (!row) throw new Error('Partner car model not found.')
    if (row.linkedCarId) {
      await syncCarOverbookUnitsFromPartnerModels(db, row.linkedCarId)
    }
    return { success: true as const }
  })

/** Lightweight car picker for linking partner models to website listings. */
export const listCarsForPartnerLink = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    return db
      .select({
        id: cars.id,
        plateNumber: cars.plateNumber,
        make: cars.make,
        model: cars.model,
        category: cars.category,
      })
      .from(cars)
      .where(ne(cars.status, 'retired'))
      .orderBy(asc(cars.make), asc(cars.model), asc(cars.plateNumber))
  })

/** Active partners for capacity allocation pickers. */
export const listActivePartnersForCapacity = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    return db
      .select({
        id: partners.id,
        name: partners.name,
        code: partners.code,
      })
      .from(partners)
      .where(eq(partners.status, 'active'))
      .orderBy(asc(partners.name))
  })
