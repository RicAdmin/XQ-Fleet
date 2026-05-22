import { config } from 'dotenv'
import pg from 'pg'

config({ path: ['.env.local', '.env'] })
const client = new pg.Client({ connectionString: process.env.DATABASE_URL! })
await client.connect()

const r = await client.query(
  `SELECT id, email, role, name, created_at
   FROM users ORDER BY created_at DESC LIMIT 50`,
)
console.log(`Users (${r.rowCount}):`)
for (const u of r.rows) {
  console.log(`  ${(u.role ?? 'null').padEnd(12)} ${u.email.padEnd(40)} ${u.name ?? ''}`)
}

await client.end()
