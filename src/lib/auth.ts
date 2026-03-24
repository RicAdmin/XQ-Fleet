import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { users } from '#/db/schema'
import { appRoles } from '#/lib/auth-model'

import * as schema from '#/db/schema'

const defaultBaseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
const defaultSecret = process.env.BETTER_AUTH_SECRET ?? 'development-secret'
const sessionInactivitySeconds = Number(
  process.env.SESSION_INACTIVITY_SECONDS ?? 60 * 60 * 8,
)

export const auth = betterAuth({
  baseURL: defaultBaseUrl,
  secret: defaultSecret,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: appRoles,
        required: false,
        defaultValue: 'customer',
        input: false,
      },
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
      invitedByUserId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: sessionInactivitySeconds,
    updateAge: Math.max(60, Math.floor(sessionInactivitySeconds / 8)),
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const matchingUsers = await db
            .select({ isActive: users.isActive })
            .from(users)
            .where(eq(users.id, session.userId))
            .limit(1)

          if (matchingUsers.length === 0 || !matchingUsers[0].isActive) {
            throw new APIError('FORBIDDEN', {
              message: 'This account has been deactivated.',
            })
          }

          return { data: session }
        },
      },
    },
  },
  plugins: [tanstackStartCookies()],
})

export type AuthSession = typeof auth.$Infer.Session
