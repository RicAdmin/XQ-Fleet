/**
 * Create a new admin user with the proper Better Auth password hash, then
 * promote it to super_admin.
 *
 * Usage:
 *   pnpm tsx scripts/create-admin.ts <email> <password> [name]
 *
 * Defaults:
 *   email    = admin@admin.com
 *   password = admin1234
 *   name     = Admin
 *
 * Safe to re-run: if the user already exists, it just promotes them.
 */
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })

const email = (process.argv[2] ?? 'admin@admin.com').trim().toLowerCase()
const password = process.argv[3] ?? 'admin1234'
const name = process.argv[4] ?? 'Admin'

// We need TanStack Start's request context to be available even outside a real
// HTTP request, because Better Auth's signUpEmail tries to set cookies. Provide
// a stub-friendly Headers object.
const headers = new Headers()

const { auth } = await import('#/lib/auth')
const { db } = await import('#/db')
const { users } = await import('#/db/schema')
const { eq } = await import('drizzle-orm')

const existing = await db
  .select({ id: users.id, role: users.role, email: users.email })
  .from(users)
  .where(eq(users.email, email))
  .limit(1)

let userId: string

if (existing.length > 0) {
  userId = existing[0].id
  console.log(`User ${email} already exists (id=${userId}, role=${existing[0].role}).`)
} else {
  console.log(`Creating new user ${email}…`)
  try {
    const result = await auth.api.signUpEmail({
      body: { name, email, password },
      headers,
    })
    userId = result.user.id
    console.log(`✓ Created user id=${userId}`)
  } catch (err) {
    console.error(`signUpEmail failed: ${(err as Error).message}`)
    process.exit(1)
  }
}

console.log(`Promoting ${email} to super_admin…`)
await db
  .update(users)
  .set({ role: 'super_admin', isActive: true, updatedAt: new Date() })
  .where(eq(users.id, userId))

console.log(`✓ Done. Login with:`)
console.log(`    email:    ${email}`)
console.log(`    password: ${password}`)
console.log(`  Then visit /internal/login and head to /admin.`)

process.exit(0)
