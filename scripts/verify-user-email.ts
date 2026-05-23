/**
 * Mark a user's email as verified (local dev helper).
 *
 * Usage:
 *   pnpm tsx scripts/verify-user-email.ts user@example.com
 */
import { config } from 'dotenv'
import pg from 'pg'

config({ path: ['.env.local', '.env'] })

const email = (process.argv[2] ?? '').trim().toLowerCase()
if (!email) {
  console.error('Usage: pnpm tsx scripts/verify-user-email.ts <email>')
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL! })
await client.connect()

const before = await client.query(
  `SELECT id, email, email_verified FROM users WHERE lower(email) = $1`,
  [email],
)

if (before.rowCount === 0) {
  console.error(`No user found with email ${email}.`)
  await client.end()
  process.exit(1)
}

const result = await client.query(
  `UPDATE users SET email_verified = true, updated_at = now()
   WHERE lower(email) = $1
   RETURNING id, email, email_verified`,
  [email],
)

console.log(`✓ ${result.rows[0].email} — email_verified=${result.rows[0].email_verified}`)
await client.end()
