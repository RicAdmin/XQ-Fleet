/**
 * Seeds `season_calendar` from repo-root `Season.csv`.
 * Clears all existing season rows then re-inserts.
 *
 * Run: pnpm db:seed-season
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from '../src/db/schema.ts'
import { seasonCalendar } from '../src/db/schema/pricing.ts'
import type { SeasonType } from '../src/db/schema/pricing.ts'

config({ path: ['.env.local', '.env'] })

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const csvPath = join(root, 'data', 'Season.csv')

const VALID_SEASON_TYPES: SeasonType[] = ['Low', 'Peak', 'Super Peak']

function parseDate(s: string): Date {
  const d = new Date(s.trim())
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`)
  return d
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set (.env / .env.local).')
    process.exit(1)
  }

  const raw = readFileSync(csvPath, 'utf8')
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) {
    console.error('Season.csv has no data rows.')
    process.exit(1)
  }

  const header = lines[0].split(',').map((h) => h.trim())
  const iFrom = header.indexOf('From_Date')
  const iTo = header.indexOf('To_Date')
  const iType = header.indexOf('Season_Type')

  if (iFrom === -1 || iTo === -1 || iType === -1) {
    console.error('Season.csv missing required columns: From_Date, To_Date, Season_Type')
    process.exit(1)
  }

  const rows: { fromDate: Date; toDate: Date; seasonType: SeasonType }[] = []

  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r].split(',').map((c) => c.trim())
    const fromRaw = cells[iFrom]
    const toRaw = cells[iTo]
    const typeRaw = cells[iType] as SeasonType

    if (!fromRaw || !toRaw || !typeRaw) continue

    if (!VALID_SEASON_TYPES.includes(typeRaw)) {
      console.warn(`Row ${r}: unknown season type "${typeRaw}", skipping`)
      continue
    }

    rows.push({ fromDate: parseDate(fromRaw), toDate: parseDate(toRaw), seasonType: typeRaw })
  }

  if (rows.length === 0) {
    console.error('No valid season rows found in Season.csv')
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: url })
  const db = drizzle(pool, { schema })

  // Clear existing season data and re-insert
  await db.delete(seasonCalendar)
  console.log('Cleared existing season_calendar rows.')

  await db.insert(seasonCalendar).values(rows)
  console.log(`Inserted ${rows.length} season range(s) into season_calendar.`)

  await pool.end()
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
