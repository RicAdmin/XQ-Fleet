/**
 * Seeds sample promos + affiliates for local development.
 *
 * - Idempotent: ON CONFLICT DO NOTHING for unique-coded rows.
 * - Run: pnpm tsx scripts/seed-admin.ts
 */
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from '../src/db/schema.ts'
import { affiliates } from '../src/db/schema/affiliates.ts'
import { promos } from '../src/db/schema/pricing.ts'

config({ path: ['.env.local', '.env'] })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: databaseUrl })
const db = drizzle(pool, { schema })

async function seedPromos() {
  console.log('— Seeding promos…')
  await db
    .insert(promos)
    .values([
      {
        title: 'WELCOME10',
        discount: '10',
        usageLeft: 100,
        code: 'WELCOME10',
        discountType: 'percent',
        discountValueSen: 10,
        maxRedemptions: 100,
        perUserLimit: 1,
        minBookingAmountSen: 0,
        applicableCarCategories: [],
        isActive: true,
        stackableWithAffiliate: true,
      },
      {
        title: 'RAYA50',
        discount: '0',
        usageLeft: 50,
        code: 'RAYA50',
        discountType: 'fixed',
        discountValueSen: 5000,
        maxRedemptions: 50,
        perUserLimit: 1,
        minBookingAmountSen: 30000,
        applicableCarCategories: ['mpv', 'suv'],
        isActive: true,
        stackableWithAffiliate: false,
      },
      {
        title: 'WEEKEND15',
        discount: '15',
        usageLeft: 0,
        code: 'WEEKEND15',
        discountType: 'percent',
        discountValueSen: 15,
        maxRedemptions: null,
        perUserLimit: 2,
        minBookingAmountSen: 0,
        applicableCarCategories: [],
        isActive: true,
        stackableWithAffiliate: true,
      },
    ])
    .onConflictDoNothing({ target: promos.code })
}

async function seedAffiliates() {
  console.log('— Seeding affiliates…')
  await db
    .insert(affiliates)
    .values([
      {
        name: 'Jane Travel Blog',
        type: 'individual',
        email: 'jane@example.com',
        code: 'jane-travel',
        commissionType: 'percent',
        commissionValueSen: 10,
        status: 'active',
        payoutMethod: 'Maybank 5123456789',
      },
      {
        name: 'Langkawi Hotel Concierge',
        type: 'company',
        email: 'concierge@langkawihotel.example',
        code: 'langkawi-hotel',
        commissionType: 'fixed',
        commissionValueSen: 5000,
        status: 'active',
        payoutMethod: 'CIMB 7012345678',
      },
      {
        name: 'Sunset Tours',
        type: 'company',
        email: 'partner@sunsettours.example',
        code: 'sunset-tours',
        commissionType: 'percent',
        commissionValueSen: 15,
        status: 'paused',
        payoutMethod: null,
      },
    ])
    .onConflictDoNothing({ target: affiliates.code })
}

async function main() {
  try {
    await seedPromos()
    await seedAffiliates()
    console.log('✓ Admin seed completed.')
  } catch (err) {
    console.error('Failed:', err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

void main()
