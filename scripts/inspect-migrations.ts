import { config } from 'dotenv'
import pg from 'pg'

config({ path: ['.env.local', '.env'] })

const client = new pg.Client({ connectionString: process.env.DATABASE_URL! })
await client.connect()

const t = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
)
console.log('Tables (' + t.rows.length + '):')
for (const r of t.rows) console.log('  ' + r.tablename)

const e = await client.query(
  `SELECT enumlabel FROM pg_enum
   JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
   WHERE pg_type.typname = 'user_role'
   ORDER BY enumsortorder`,
)
console.log('\nuser_role:', e.rows.map((r) => r.enumlabel))

const p = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'promos' ORDER BY ordinal_position`,
)
console.log('\npromos columns:', p.rows.map((r) => r.column_name).join(', '))

const r = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'rentals' AND column_name LIKE 'affiliate%' ORDER BY ordinal_position`,
)
console.log('\nrentals affiliate columns:', r.rows.map((r) => r.column_name))

await client.end()
