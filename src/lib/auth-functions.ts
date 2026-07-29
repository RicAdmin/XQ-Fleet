import { createServerFn } from '@tanstack/react-start'
import { eq, inArray } from 'drizzle-orm'
import type { AuthSession } from '#/lib/auth'
import type { AppRole } from '#/lib/auth-model'

import { users } from '#/db/schema'
import { fullAdminRoles, isAppRole } from '#/lib/auth-model'

type OwnerBootstrapInput = {
  name: string
  email: string
  password: string
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

export const getRequestSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSession | null> => {
    const { lookupRequestSession } = await import('#/lib/auth-session.server')
    return lookupRequestSession()
  },
)

export async function requireRole(allowedRoles: ReadonlyArray<AppRole>) {
  const session = await getRequestSession()

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
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, result.user.id))

    return { email }
  })
