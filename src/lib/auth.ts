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

const extraTrustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const isDev = process.env.NODE_ENV !== 'production'

const trustedOrigins = Array.from(
  new Set([
    defaultBaseUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(isDev ? ['http://localhost:*', 'http://127.0.0.1:*'] : []),
    ...extraTrustedOrigins,
  ]),
)

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
const googleSocialProvider =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined

export const auth = betterAuth({
  baseURL: defaultBaseUrl,
  secret: defaultSecret,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.AUTH_SKIP_EMAIL_VERIFICATION !== 'true',
    sendResetPassword: async ({ user, url }) => {
      const { sendPasswordResetEmail } = await import('#/lib/email-functions')
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        url,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { sendEmailVerification } = await import('#/lib/email-functions')
      await sendEmailVerification({
        to: user.email,
        name: user.name,
        url,
      })
    },
  },
  ...(googleSocialProvider ? { socialProviders: googleSocialProvider } : {}),
  user: {
    additionalFields: {
      role: {
        type: [...appRoles],
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
      staffProfile: {
        type: ['customer_service', 'operations'],
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
