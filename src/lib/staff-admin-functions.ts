import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { staffInvitations, users } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fullAdminRoles, staffProfiles, type StaffProfile } from '#/lib/auth-model'

export type StaffUserRow = {
  id: string
  name: string
  email: string
  role: string
  staffProfile: StaffProfile | null
  isActive: boolean
  createdAt: Date
}

export const listStaffUsers = createServerFn({ method: 'GET' }).handler(
  async (): Promise<StaffUserRow[]> => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        staffProfile: users.staffProfile,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(inArray(users.role, ['staff', 'owner', 'super_admin']))
      .orderBy(desc(users.createdAt))

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      staffProfile: row.staffProfile,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
    }))
  },
)

const updateStaffProfileSchema = z.object({
  userId: z.string().min(1),
  staffProfile: z.enum(staffProfiles),
})

export const updateStaffProfile = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof updateStaffProfileSchema>) =>
    updateStaffProfileSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    await db
      .update(users)
      .set({
        staffProfile: data.staffProfile,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, data.userId))

    return { ok: true as const }
  })

export const listPendingStaffInvitations = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const rows = await db
      .select({
        id: staffInvitations.id,
        email: staffInvitations.email,
        createdAt: staffInvitations.createdAt,
        expiresAt: staffInvitations.expiresAt,
      })
      .from(staffInvitations)
      .where(and(isNull(staffInvitations.acceptedAt), isNull(staffInvitations.revokedAt)))
      .orderBy(desc(staffInvitations.createdAt))

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: new Date(row.createdAt),
      expiresAt: new Date(row.expiresAt),
    }))
  },
)
