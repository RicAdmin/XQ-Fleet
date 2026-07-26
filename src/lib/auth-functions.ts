import { createHash, randomBytes } from 'node:crypto'

import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, gt, inArray, isNull } from 'drizzle-orm'
import type { AuthSession } from '#/lib/auth'
import type { AppRole } from '#/lib/auth-model'

import { sessions, staffInvitations, users } from '#/db/schema'
import { fullAdminRoles, isAppRole } from '#/lib/auth-model'

type OwnerBootstrapInput = {
  name: string
  email: string
  password: string
}

type CreateStaffInvitationInput = {
  email: string
}

type StaffInvitationLookupInput = {
  token: string
}

type AcceptStaffInvitationInput = {
  token: string
  name: string
  password: string
}

type DeactivateStaffAccountInput = {
  userId: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function ensureDisplayName(name: string) {
  const trimmed = name.trim()

  if (trimmed.length < 2) {
    throw new Error('Please enter a full name.')
  }

  return trimmed
}

function ensurePassword(password: string) {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long.')
  }

  return password
}

function ensureEmail(email: string) {
  const normalized = normalizeEmail(email)

  if (!normalized.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }

  return normalized
}

function createInvitationToken() {
  return randomBytes(24).toString('hex')
}

function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function invitationLifetimeMs() {
  return Number(process.env.STAFF_INVITATION_HOURS ?? 72) * 60 * 60 * 1000
}

function invitationUrl(token: string) {
  const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  return `${baseUrl}/internal/invite/${token}`
}

/** Collapse duplicate positive session lookups during a navigation burst. */
const SESSION_TTL_MS = 5_000
const sessionLookupCache = new Map<
  string,
  { expiresAt: number; promise: Promise<AuthSession | null> }
>()

function sessionCacheKey(cookieHeader: string | null): string | null {
  // Unauthenticated requests share an empty cookie header. Never cache those —
  // a cached null can race with authenticated lookups that briefly omit cookies.
  if (!cookieHeader || !cookieHeader.includes('better-auth.session_token')) {
    return null
  }
  return cookieHeader
}

async function lookupRequestSession(): Promise<AuthSession | null> {
  const { auth } = await import('#/lib/auth')
  const { getRequestHeaders } = await import('@tanstack/react-start/server')
  const headers = getRequestHeaders()
  const cookie = headers.get('cookie')
  const key = sessionCacheKey(cookie)
  const now = Date.now()

  if (key) {
    const cached = sessionLookupCache.get(key)
    if (cached && cached.expiresAt > now) {
      return cached.promise
    }
  }

  const promise = auth.api
    .getSession({ headers })
    .then((session) => {
      if (!session || !isAppRole(session.user.role)) return null
      return session
    })
    .catch((err) => {
      if (key) sessionLookupCache.delete(key)
      throw err
    })

  // Only cache resolved positive sessions (and in-flight lookups that have a cookie).
  if (key) {
    sessionLookupCache.set(key, { expiresAt: now + SESSION_TTL_MS, promise })
    if (sessionLookupCache.size > 200) {
      for (const [cacheKey, entry] of sessionLookupCache) {
        if (entry.expiresAt <= now) sessionLookupCache.delete(cacheKey)
      }
    }
  }

  const session = await promise
  if (key && !session) {
    sessionLookupCache.delete(key)
  }
  return session
}

export const getRequestSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession | null> => lookupRequestSession(),
)

export async function requireRole(allowedRoles: ReadonlyArray<AppRole>) {
  const session = await lookupRequestSession()

  if (!session) {
    throw new Error('You must be signed in to continue.')
  }

  const role = session.user.role
  if (!isAppRole(role) || !allowedRoles.includes(role)) {
    throw new Error('You do not have access to this action.')
  }

  return session
}

/** Shortcut for actions that require owner or super_admin (full admin privileges). */
export async function requireAdmin() {
  return requireRole(['owner', 'super_admin'])
}

export const getOwnerSetupState = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { db } = await import('#/db')
    const existing =
      (
        await db
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.role, [...fullAdminRoles]))
          .limit(1)
      )[0] ?? null

    return { hasOwner: Boolean(existing) }
  },
)

export const createInitialOwner = createServerFn({ method: 'POST' })
  .inputValidator((input: OwnerBootstrapInput) => input)
  .handler(async ({ data }) => {
    const { db } = await import('#/db')
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const owners = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'owner'))
      .limit(1)

    if (owners.length > 0) {
      throw new Error('An owner account already exists.')
    }

    const name = ensureDisplayName(data.name)
    const email = ensureEmail(data.email)
    const password = ensurePassword(data.password)

    const result = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
      headers: getRequestHeaders(),
    })

    await db
      .update(users)
      .set({
        role: 'owner',
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, result.user.id))

    return { email }
  })

export const getStaffDirectory = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole(['owner'])

    const { db } = await import('#/db')
    const staffUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        status: users.isActive,
      })
      .from(users)
      .where(eq(users.role, 'staff'))
      .orderBy(desc(users.createdAt))

    const pendingInvitations = await db
      .select({
        id: staffInvitations.id,
        email: staffInvitations.email,
        expiresAt: staffInvitations.expiresAt,
        createdAt: staffInvitations.createdAt,
      })
      .from(staffInvitations)
      .where(
        and(
          isNull(staffInvitations.acceptedAt),
          isNull(staffInvitations.revokedAt),
          gt(staffInvitations.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(staffInvitations.createdAt))

    return {
      staffUsers: staffUsers.map((user) => ({
        ...user,
        status: user.status ? 'active' : 'deactivated',
      })),
      pendingInvitations,
    }
  },
)

export const createStaffInvitation = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateStaffInvitationInput) => input)
  .handler(async ({ data }) => {
    const session = await requireRole(['owner'])
    const email = ensureEmail(data.email)

    const { db } = await import('#/db')
    const existingUsers = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUsers.length > 0) {
      throw new Error('An account already exists for that email address.')
    }

    const now = new Date()

    await db
      .update(staffInvitations)
      .set({ revokedAt: now })
      .where(
        and(
          eq(staffInvitations.email, email),
          isNull(staffInvitations.acceptedAt),
          isNull(staffInvitations.revokedAt),
        ),
      )

    const token = createInvitationToken()
    const expiresAt = new Date(Date.now() + invitationLifetimeMs())

    await db.insert(staffInvitations).values({
      email,
      invitedByUserId: session.user.id,
      tokenHash: hashInvitationToken(token),
      expiresAt,
    })

    return {
      email,
      expiresAt,
      inviteUrl: invitationUrl(token),
    }
  })

export const getStaffInvitation = createServerFn({ method: 'POST' })
  .inputValidator((input: StaffInvitationLookupInput) => input)
  .handler(async ({ data }) => {
    const { db } = await import('#/db')
    const tokenHash = hashInvitationToken(data.token)

    const invites = await db
      .select({
        email: staffInvitations.email,
        expiresAt: staffInvitations.expiresAt,
        acceptedAt: staffInvitations.acceptedAt,
        revokedAt: staffInvitations.revokedAt,
      })
      .from(staffInvitations)
      .where(eq(staffInvitations.tokenHash, tokenHash))
      .limit(1)

    if (invites.length === 0) {
      return { status: 'invalid' as const }
    }

    const invite = invites[0]

    if (invite.revokedAt) {
      return { status: 'revoked' as const }
    }

    if (invite.acceptedAt) {
      return { status: 'accepted' as const }
    }

    if (invite.expiresAt <= new Date()) {
      return { status: 'expired' as const }
    }

    return {
      status: 'valid' as const,
      email: invite.email,
      expiresAt: invite.expiresAt,
    }
  })

export const acceptStaffInvitation = createServerFn({ method: 'POST' })
  .inputValidator((input: AcceptStaffInvitationInput) => input)
  .handler(async ({ data }) => {
    const { db } = await import('#/db')
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const tokenHash = hashInvitationToken(data.token)

    const invites = await db
      .select({
        id: staffInvitations.id,
        email: staffInvitations.email,
        invitedByUserId: staffInvitations.invitedByUserId,
        expiresAt: staffInvitations.expiresAt,
        acceptedAt: staffInvitations.acceptedAt,
        revokedAt: staffInvitations.revokedAt,
      })
      .from(staffInvitations)
      .where(eq(staffInvitations.tokenHash, tokenHash))
      .limit(1)

    if (invites.length === 0) {
      throw new Error('That invitation is no longer valid.')
    }

    const invite = invites[0]

    if (invite.revokedAt || invite.acceptedAt || invite.expiresAt <= new Date()) {
      throw new Error('That invitation is no longer valid.')
    }

    const name = ensureDisplayName(data.name)
    const password = ensurePassword(data.password)

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1)

    if (existingUsers.length > 0) {
      throw new Error('An account already exists for this invitation email.')
    }

    const result = await auth.api.signUpEmail({
      body: {
        name,
        email: invite.email,
        password,
      },
      headers: getRequestHeaders(),
    })

    await db
      .update(users)
      .set({
        role: 'staff',
        staffProfile: 'customer_service',
        isActive: true,
        invitedByUserId: invite.invitedByUserId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, result.user.id))

    await db
      .update(staffInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(staffInvitations.id, invite.id))

    return {
      email: invite.email,
    }
  })

export const deactivateStaffAccount = createServerFn({ method: 'POST' })
  .inputValidator((input: DeactivateStaffAccountInput) => input)
  .handler(async ({ data }) => {
    const session = await requireRole(['owner'])

    if (data.userId === session.user.id) {
      throw new Error('Owners cannot deactivate their own account.')
    }

    const { db } = await import('#/db')
    const staffUsers = await db
      .select({ id: users.id, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1)

    if (staffUsers.length === 0 || staffUsers[0].role !== 'staff') {
      throw new Error('Only staff accounts can be deactivated here.')
    }

    const staffUser = staffUsers[0]

    if (!staffUser.isActive) {
      return { userId: data.userId }
    }

    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, data.userId))

    await db.delete(sessions).where(eq(sessions.userId, data.userId))

    return { userId: data.userId }
  })
