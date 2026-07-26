import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, isNotNull, isNull, ne, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { customers } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles } from '#/lib/auth-model'
import {
  adminInputValidator,
  paginationSchema,
  sortDirSchema,
} from '#/lib/validation/admin-schemas'

type CreateCustomerInput = {
  fullName: string
  icOrPassport: string
  phone: string
  email?: string
  address?: string
}

type UpdateCustomerInput = {
  customerId: string
  fullName: string
  icOrPassport: string
  phone: string
  email?: string
  address?: string
}

type DeleteCustomerInput = {
  customerId: string
}

type GetCustomerByIdInput = {
  customerId: string
}

function validateCustomerFields(data: {
  fullName: string
  icOrPassport: string
  phone: string
  email?: string
}) {
  const fullName = data.fullName.trim()
  if (!fullName) throw new Error('Full name is required.')

  const icOrPassport = data.icOrPassport.trim()
  if (!icOrPassport) throw new Error('IC or passport number is required.')

  const phone = data.phone.trim()
  if (!phone) throw new Error('Phone number is required.')

  const email = data.email?.trim() || undefined
  if (email && !email.includes('@'))
    throw new Error('Please enter a valid email address.')

  return { fullName, icOrPassport, phone, email }
}

export const getCustomers = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(fleetOpsRoles)
  const { db } = await import('#/db')
  return db.select().from(customers).orderBy(desc(customers.createdAt))
})

export type CustomerSearchRow = {
  id: string
  fullName: string | null
  icOrPassport: string | null
  phone: string | null
  email: string | null
}

const searchCustomersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(50).default(30),
})

export const searchCustomers = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(searchCustomersSchema))
  .handler(async ({ data }): Promise<CustomerSearchRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const limit = data.limit

    if (!data.q) {
      return db
        .select({
          id: customers.id,
          fullName: customers.fullName,
          icOrPassport: customers.icOrPassport,
          phone: customers.phone,
          email: customers.email,
        })
        .from(customers)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
    }

    const needle = `%${data.q}%`
    return db
      .select({
        id: customers.id,
        fullName: customers.fullName,
        icOrPassport: customers.icOrPassport,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .where(
        or(
          ilike(customers.fullName, needle),
          ilike(customers.icOrPassport, needle),
          ilike(customers.phone, needle),
          ilike(customers.email, needle),
        )!,
      )
      .orderBy(desc(customers.createdAt))
      .limit(limit)
  })

export type CustomerListRow = {
  id: string
  authUserId: string | null
  fullName: string | null
  email: string | null
  icOrPassport: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}

export type CustomerListResult = {
  rows: CustomerListRow[]
  total: number
  page: number
  pageSize: number
  accountCounts?: Record<'all' | 'linked' | 'walk-in', number>
}

const listCustomersSchema = paginationSchema.extend({
  accountFilter: z.enum(['all', 'linked', 'walk-in']).default('all'),
  search: z.string().trim().max(120).optional(),
  includeAccountCounts: z.boolean().optional(),
  sortKey: z
    .enum(['fullName', 'icOrPassport', 'phone', 'email', 'createdAt'])
    .default('createdAt'),
  sortDir: sortDirSchema,
})

async function queryCustomerAccountCounts() {
  const { db } = await import('#/db')
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      linked: sql<number>`count(*) filter (where ${customers.authUserId} is not null)::int`,
      walkIn: sql<number>`count(*) filter (where ${customers.authUserId} is null)::int`,
    })
    .from(customers)

  return {
    all: Number(row?.all ?? 0),
    linked: Number(row?.linked ?? 0),
    'walk-in': Number(row?.walkIn ?? 0),
  }
}

export const getCustomerAccountCounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole(fleetOpsRoles)
    return queryCustomerAccountCounts()
  },
)

export const listCustomers = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listCustomersSchema))
  .handler(async ({ data }): Promise<CustomerListResult> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const filters = []
    if (data.accountFilter === 'linked') filters.push(isNotNull(customers.authUserId))
    if (data.accountFilter === 'walk-in') filters.push(isNull(customers.authUserId))
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(
        or(
          ilike(customers.fullName, needle),
          ilike(customers.icOrPassport, needle),
          ilike(customers.phone, needle),
          ilike(customers.email, needle),
        )!,
      )
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const sortColumn = {
      fullName: customers.fullName,
      icOrPassport: customers.icOrPassport,
      phone: customers.phone,
      email: customers.email,
      createdAt: customers.createdAt,
    }[data.sortKey]

    const orderBy = data.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db.select().from(customers)
    const rowsPromise = whereClause
      ? baseQuery.where(whereClause).orderBy(orderBy).limit(data.pageSize).offset(offset)
      : baseQuery.orderBy(orderBy).limit(data.pageSize).offset(offset)

    const countBase = db.select({ count: sql<number>`count(*)::int` }).from(customers)
    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult, accountCounts] = await Promise.all([
      rowsPromise,
      countPromise,
      data.includeAccountCounts ? queryCustomerAccountCounts() : Promise.resolve(undefined),
    ])

    return {
      rows,
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
      ...(accountCounts ? { accountCounts } : {}),
    }
  })

export const getCustomerById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetCustomerByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const results = await db
      .select()
      .from(customers)
      .where(eq(customers.id, data.customerId))
      .limit(1)
    return results[0] ?? null
  })

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateCustomerInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const validated = validateCustomerFields(data)

    const { db } = await import('#/db')
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.icOrPassport, validated.icOrPassport))
      .limit(1)

    if (existing.length > 0)
      throw new Error(
        `A customer with IC/passport "${validated.icOrPassport}" already exists.`,
      )

    const result = await db
      .insert(customers)
      .values({
        fullName: validated.fullName,
        icOrPassport: validated.icOrPassport,
        phone: validated.phone,
        email: validated.email ?? null,
        address: data.address?.trim() || null,
      })
      .returning()

    return result[0]
  })

type CreateWalkInCustomerInput = {
  fullName: string
  phone: string
  email?: string
  xqIdNo?: string
}

async function uniqueWalkInIc(
  db: Awaited<typeof import('#/db')>['db'],
  phone: string,
): Promise<string> {
  const digits = phone.replace(/\D/g, '')
  const base = `W-${digits || '000'}`
  let candidate = base
  let suffix = 1
  while (true) {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.icOrPassport, candidate))
      .limit(1)
    if (existing.length === 0) return candidate
    candidate = `${base}-${suffix}`
    suffix += 1
  }
}

/** Quick customer create from CS job form — IC is auto-generated from mobile. */
export const createWalkInCustomer = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateWalkInCustomerInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)

    const fullName = data.fullName.trim()
    if (!fullName) throw new Error('Customer name is required.')

    const phone = data.phone.trim()
    if (!phone) throw new Error('Mobile number is required.')

    const email = data.email?.trim() || undefined
    if (email && !email.includes('@'))
      throw new Error('Please enter a valid email address.')

    const { db } = await import('#/db')
    const xqIdNo = data.xqIdNo?.trim()
    let icOrPassport: string
    if (xqIdNo) {
      const existing = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.icOrPassport, xqIdNo))
        .limit(1)
      if (existing.length > 0) {
        throw new Error(`A customer with XQ_ID "${xqIdNo}" already exists.`)
      }
      icOrPassport = xqIdNo
    } else {
      icOrPassport = await uniqueWalkInIc(db, phone)
    }

    const result = await db
      .insert(customers)
      .values({
        fullName,
        icOrPassport,
        phone,
        email: email ?? null,
      })
      .returning()

    return result[0]
  })

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCustomerInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const validated = validateCustomerFields(data)

    const { db } = await import('#/db')
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(
          eq(customers.icOrPassport, validated.icOrPassport),
          ne(customers.id, data.customerId),
        ),
      )
      .limit(1)

    if (existing.length > 0)
      throw new Error(
        `A customer with IC/passport "${validated.icOrPassport}" already exists.`,
      )

    const result = await db
      .update(customers)
      .set({
        fullName: validated.fullName,
        icOrPassport: validated.icOrPassport,
        phone: validated.phone,
        email: validated.email ?? null,
        address: data.address?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, data.customerId))
      .returning()

    if (!result[0]) throw new Error('Customer not found.')
    return result[0]
  })

export const deleteCustomer = createServerFn({ method: 'POST' })
  .inputValidator((input: DeleteCustomerInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const result = await db
      .delete(customers)
      .where(eq(customers.id, data.customerId))
      .returning({ id: customers.id })

    if (!result[0]) throw new Error('Customer not found.')
    return { customerId: data.customerId }
  })
