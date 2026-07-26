import { createServerFn } from '@tanstack/react-start'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { pickupLocations } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles } from '#/lib/auth-model'

export type PickupLocationRow = {
  id: string
  code: string
  label: string
  kind: string
  deliveryFeeSen: number
  isActive: boolean
  sortOrder: number
  notes: string | null
}

const DEFAULT_LOCATIONS: Omit<PickupLocationRow, 'id' | 'notes'>[] = [
  { code: 'office', label: 'Office', kind: 'office', deliveryFeeSen: 0, isActive: true, sortOrder: 0 },
  { code: 'airport', label: 'Airport', kind: 'airport', deliveryFeeSen: 0, isActive: true, sortOrder: 1 },
  { code: 'jetty', label: 'Jetty', kind: 'jetty', deliveryFeeSen: 0, isActive: true, sortOrder: 2 },
  { code: 'hotel', label: 'Hotel delivery', kind: 'hotel', deliveryFeeSen: 3000, isActive: true, sortOrder: 3 },
]

async function ensureDefaultLocations(db: Awaited<typeof import('#/db')>['db']) {
  const existing = await db.select({ id: pickupLocations.id }).from(pickupLocations).limit(1)
  if (existing.length > 0) return

  await db.insert(pickupLocations).values(
    DEFAULT_LOCATIONS.map((row) => ({
      code: row.code,
      label: row.label,
      kind: row.kind as 'office' | 'airport' | 'jetty' | 'hotel' | 'custom',
      deliveryFeeSen: row.deliveryFeeSen,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    })),
  )
}

export const listActivePickupLocations = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PickupLocationRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    await ensureDefaultLocations(db)

    const rows = await db
      .select()
      .from(pickupLocations)
      .where(eq(pickupLocations.isActive, true))
      .orderBy(asc(pickupLocations.sortOrder), asc(pickupLocations.label))

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      kind: row.kind,
      deliveryFeeSen: row.deliveryFeeSen,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      notes: row.notes,
    }))
  },
)

export const listPickupLocations = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PickupLocationRow[]> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    await ensureDefaultLocations(db)

    const rows = await db
      .select()
      .from(pickupLocations)
      .orderBy(asc(pickupLocations.sortOrder), asc(pickupLocations.label))

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      kind: row.kind,
      deliveryFeeSen: row.deliveryFeeSen,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      notes: row.notes,
    }))
  },
)

const upsertLocationSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
  kind: z.enum(['office', 'airport', 'jetty', 'hotel', 'custom']),
  deliveryFeeSen: z.number().int().min(0),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().trim().max(500).optional(),
})

export const savePickupLocation = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof upsertLocationSchema>) => upsertLocationSchema.parse(input))
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    if (data.id) {
      await db
        .update(pickupLocations)
        .set({
          code: data.code,
          label: data.label,
          kind: data.kind,
          deliveryFeeSen: data.deliveryFeeSen,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          notes: data.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(pickupLocations.id, data.id))
      return { id: data.id }
    }

    const [row] = await db
      .insert(pickupLocations)
      .values({
        code: data.code,
        label: data.label,
        kind: data.kind,
        deliveryFeeSen: data.deliveryFeeSen,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        notes: data.notes ?? null,
      })
      .returning({ id: pickupLocations.id })

    return { id: row.id }
  })
