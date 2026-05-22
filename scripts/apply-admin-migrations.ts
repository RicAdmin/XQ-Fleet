/**
 * Applies ONLY the admin-module migrations (0006/0007/0008) directly to the
 * database, then records them in `drizzle.__drizzle_migrations` so future
 * `pnpm db:migrate` runs see them as already applied.
 *
 * Use this when the existing schema (everything in 0000-0005) was created via
 * `db:push` and therefore wasn't tracked in the drizzle migrations table.
 *
 * Each .sql file is executed inside its own transaction so a failure rolls
 * back cleanly.
 */
import { config } from 'dotenv'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import pg from 'pg'

config({ path: ['.env.local', '.env'] })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const drizzleDir = join(root, 'drizzle')

const ADMIN_MIGRATIONS = [
  '0006_admin_phase0_phase1.sql',
  '0007_admin_phase2_promos.sql',
  '0008_admin_phase3_affiliates.sql',
] as const

const client = new pg.Client({ connectionString: url })
await client.connect()

// Make sure the drizzle bookkeeping schema/table exists. This matches what
// drizzle-kit creates on first migrate.
await client.query(`CREATE SCHEMA IF NOT EXISTS drizzle`)
await client.query(`
  CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )
`)

let applied = 0
let skipped = 0

for (const filename of ADMIN_MIGRATIONS) {
  const filePath = join(drizzleDir, filename)
  const sql = readFileSync(filePath, 'utf8')
  // drizzle uses the SHA-256 of the file content as the hash.
  const hash = createHash('sha256').update(sql).digest('hex')

  const existing = await client.query(
    `SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = $1 LIMIT 1`,
    [hash],
  )
  if (existing.rowCount && existing.rowCount > 0) {
    console.log(`✓ ${filename}  (already recorded, skipping)`)
    skipped++
    continue
  }

  console.log(`→ ${filename}  …`)
  // Split on the explicit breakpoint marker so each statement runs alone —
  // CREATE TYPE etc. can't be combined with other DDL in some drivers.
  const statements = sql
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  try {
    await client.query('BEGIN')
    for (const stmt of statements) {
      await client.query(stmt)
    }
    await client.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, Date.now()],
    )
    await client.query('COMMIT')
    console.log(`  ✓ applied (${statements.length} statements)`)
    applied++
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(`  ✗ FAILED — rolled back`)
    console.error(`    ${(err as Error).message}`)
    await client.end()
    process.exit(1)
  }
}

console.log(`\nDone. Applied ${applied} migration(s), skipped ${skipped}.`)
await client.end()
