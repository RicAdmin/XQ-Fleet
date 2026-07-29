import { randomBytes } from 'node:crypto'

import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { accounts, sessions, users } from '#/db/schema'
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

const createStaffAccountSchema = z.object({
  name: z.string().trim().min(2, 'Please enter a full name.'),
  email: z.string().trim().min(3, 'Please enter a valid email address.'),
  staffProfile: z.enum(staffProfiles),
  password: z.string().min(8, 'Password must be at least 8 characters long.').optional(),
})

const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

function generateTempPassword(length = 12): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length]
  }
  return out
}

/** Admins create staff accounts directly (no email invitation). */
export const createStaffAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof createStaffAccountSchema>) =>
    createStaffAccountSchema.parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireRole(fullAdminRoles)
    const { db } = await import('#/db')
    const { hashPassword } = await import('better-auth/crypto')

    const email = data.email.toLowerCase()
    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address.')
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existing.length > 0) {
      throw new Error('An account already exists for that email address.')
    }

    const generated = !data.password?.trim()
    const password = data.password?.trim() ? data.password : generateTempPassword()
    const passwordHash = await hashPassword(password)
    const now = new Date().toISOString()
    const userId = randomBytes(16).toString('hex')

    await db.insert(users).values({
      id: userId,
      name: data.name.trim(),
      email,
      emailVerified: true,
      role: 'staff',
      staffProfile: data.staffProfile,
      isActive: true,
      invitedByUserId: session.user.id,
      createdAt: now,
      updatedAt: now,
    })

    await db.insert(accounts).values({
      id: randomBytes(16).toString('hex'),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })

    return {
      userId,
      email,
      tempPassword: generated ? password : null,
    }
  })

const userIdSchema = z.object({ userId: z.string().min(1) })

async function getManageableStaffUser(userId: string, actorId: string) {
  if (userId === actorId) {
    throw new Error('You cannot manage your own account here.')
  }
  const { db } = await import('#/db')
  const rows = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (rows.length === 0) {
    throw new Error('That account does not exist.')
  }
  if (rows[0].role !== 'staff') {
    throw new Error('Only staff accounts can be managed here.')
  }
  return rows[0]
}

export const setStaffActive = createServerFn({ method: 'POST' })
  .inputValidator((input: { userId: string; isActive: boolean }) =>
    userIdSchema.extend({ isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = await requireRole(fullAdminRoles)
    await getManageableStaffUser(data.userId, session.user.id)
    const { db } = await import('#/db')

    await db
      .update(users)
      .set({ isActive: data.isActive, updatedAt: new Date().toISOString() })
      .where(eq(users.id, data.userId))

    if (!data.isActive) {
      await db.delete(sessions).where(eq(sessions.userId, data.userId))
    }

    return { ok: true as const }
  })

export const regenerateStaffPassword = createServerFn({ method: 'POST' })
  .inputValidator((input: z.infer<typeof userIdSchema>) => userIdSchema.parse(input))
  .handler(async ({ data }) => {
    const session = await requireRole(fullAdminRoles)
    await getManageableStaffUser(data.userId, session.user.id)
    const { db } = await import('#/db')
    const { hashPassword } = await import('better-auth/crypto')

    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)
    const now = new Date().toISOString()

    const existing = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.userId, data.userId), eq(accounts.providerId, 'credential')))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(accounts)
        .set({ password: passwordHash, updatedAt: now })
        .where(eq(accounts.id, existing[0].id))
    } else {
      await db.insert(accounts).values({
        id: randomBytes(16).toString('hex'),
        accountId: data.userId,
        providerId: 'credential',
        userId: data.userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      })
    }

    await db.delete(sessions).where(eq(sessions.userId, data.userId))

    return { tempPassword }
  })
