import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ne } from 'drizzle-orm'

import { customers } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'

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
  await requireRole(['owner', 'staff'])
  const { db } = await import('#/db')
  return db.select().from(customers).orderBy(desc(customers.createdAt))
})

export const getCustomerById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetCustomerByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner', 'staff'])
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
    await requireRole(['owner', 'staff'])
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

export const updateCustomer = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateCustomerInput) => input)
  .handler(async ({ data }) => {
    await requireRole(['owner', 'staff'])
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
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const result = await db
      .delete(customers)
      .where(eq(customers.id, data.customerId))
      .returning({ id: customers.id })

    if (!result[0]) throw new Error('Customer not found.')
    return { customerId: data.customerId }
  })
