/**
 * One-shot helper to promote a user to super_admin.
 *
 * Usage:
 *   pnpm tsx scripts/promote-admin.ts <email>
 *
 * Defaults to `admin@admin.com` if no email is provided.
 */
import { config } from 'dotenv'
import pg from 'pg'

config({ path: ['.env.local', '.env'] })

const email = (process.argv[2] ?? 'admin@admin.com').trim().toLowerCase()
if (!email) {
  console.error('Usage: pnpm tsx scripts/promote-admin.ts <email>')
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL! })
await client.connect()

const before = await client.query(
  `SELECT id, email, role FROM users WHERE lower(email) = $1`,
  [email],
)

if (before.rowCount === 0) {
  console.error(`No user found with email ${email}.`)
  await client.end()
  process.exit(1)
}

console.log(`Found user ${before.rows[0].id} — current role: ${before.rows[0].role}`)

const result = await client.query(
  `UPDATE users SET role = 'super_admin', updated_at = now()
   WHERE lower(email) = $1
   RETURNING id, email, role`,
  [email],
)

if (result.rowCount === 0) {
  console.error('Update failed unexpectedly.')
  await client.end()
  process.exit(1)
}

console.log(`✓ Updated ${result.rowCount} user(s):`)
for (const r of result.rows) {
  console.log(`  ${r.email} → role=${r.role}`)
}

await client.end()
