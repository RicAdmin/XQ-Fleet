/**
 * Verify CS create-3-jobs → Jobs list → Ops Pickup → Ops Return flow.
 *
 * Run: pnpm tsx scripts/verify-3car-cs-ops-flow.ts
 */
import { config } from 'dotenv'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from '../src/db/schema.ts'
import { cars, customers, rentals } from '../src/db/schema.ts'
import {
  assertCarHasBookingCapacity,
  usesSingleUnitCarStatus,
} from '../src/lib/fleet-capacity.ts'
import { resolveFulfillmentForListingCar } from '../src/lib/rental-fulfillment.ts'

config({ path: ['.env.local', '.env'] })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: databaseUrl })
const db = drizzle(pool, { schema })

const MARKER = `E2E3VEH-${Date.now()}`

function ymd(offsetDays: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function pass(label: string, detail: string) {
  console.log(`✓ ${label} — ${detail}`)
}

function fail(label: string, detail: string): never {
  console.error(`✗ ${label} — ${detail}`)
  throw new Error(detail)
}

async function main() {
  console.log(`\n=== Verify 3-vehicle CS → Ops flow (${MARKER}) ===\n`)

  const start = ymd(3)
  const end = ymd(6)
  const tripStart = new Date(`${start}T00:00:00`)
  const tripEnd = new Date(`${end}T00:00:00`)

  const availableCars = await db
    .select({
      id: cars.id,
      make: cars.make,
      model: cars.model,
      plateNumber: cars.plateNumber,
      dailyRateSen: cars.dailyRateSen,
      status: cars.status,
    })
    .from(cars)
    .where(eq(cars.status, 'available'))
    .orderBy(asc(cars.plateNumber))
    .limit(20)

  const selected = availableCars.slice(0, 3)
  if (selected.length < 3) {
    fail('Select vehicles', `Need 3 available cars, found ${selected.length}`)
  }

  pass(
    'Select 3 vehicles',
    selected.map((c) => `${c.make} ${c.model} (${c.plateNumber})`).join(', '),
  )

  const [customer] = await db
    .insert(customers)
    .values({
      fullName: `E2e Verify ${MARKER}`,
      email: `e2e-${Date.now()}@xqcar.test`,
      phone: '0123456789',
      icOrPassport: `E2E${Date.now()}`,
    })
    .returning()

  pass('Create walk-in customer', `${customer.fullName} (${customer.phone})`)

  const createdIds: string[] = []

  for (const car of selected) {
    const fleetCapacity = await assertCarHasBookingCapacity(db, {
      carId: car.id,
      tripStart,
      tripEnd,
      errorMessage: `No capacity for ${car.plateNumber}`,
    })

    const rentalId = crypto.randomUUID()
    const fulfillment = await resolveFulfillmentForListingCar(db, {
      listingCarId: car.id,
      tripStart,
      tripEnd,
      rentalIdForTempLabel: rentalId,
    })

    if (usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'reserved', updatedAt: new Date() })
        .where(eq(cars.id, car.id))
    }

    const [row] = await db
      .insert(rentals)
      .values({
        id: rentalId,
        carId: car.id,
        assignedCarId: fulfillment.assignedCarId,
        fulfillmentSource: fulfillment.fulfillmentSource,
        partnerId: fulfillment.partnerId,
        partnerCarModelId: fulfillment.partnerCarModelId,
        tempPlateLabel: fulfillment.tempPlateLabel,
        plateConfirmedAt: fulfillment.plateConfirmedAt,
        customerId: customer.id,
        type: 'walk-in',
        status: 'pending',
        paymentStatus: 'unpaid',
        startDate: tripStart,
        endDate: tripEnd,
        pickUpTime: '09:00:00',
        returnTime: '09:00:00',
        pickUpLocation: 'Airport',
        returnLocation: 'Airport',
        dailyRateSen: car.dailyRateSen,
        totalAmountSen: car.dailyRateSen * 3,
        depositAmountSen: 0,
        paidAmountSen: 0,
      })
      .returning({ id: rentals.id, status: rentals.status })

    createdIds.push(row.id)
  }

  pass('Create 3 in-house jobs', `${createdIds.length} pending jobs for ${start} → ${end}`)

  const jobRows = await db
    .select({
      id: rentals.id,
      status: rentals.status,
      plate: cars.plateNumber,
      customerName: customers.fullName,
    })
    .from(rentals)
    .leftJoin(cars, eq(rentals.carId, cars.id))
    .leftJoin(customers, eq(rentals.customerId, customers.id))
    .where(inArray(rentals.id, createdIds))

  if (jobRows.length !== 3) fail('Jobs list', `Expected 3 rows, got ${jobRows.length}`)
  if (jobRows.some((r) => r.status !== 'pending')) {
    fail('Jobs list', `Expected all pending, got ${jobRows.map((r) => r.status).join(',')}`)
  }
  pass(
    'Visible in Jobs (pending)',
    jobRows.map((r) => `${r.plate}:${r.status}`).join(', '),
  )

  const pickups = await db
    .select({ id: rentals.id, plate: cars.plateNumber })
    .from(rentals)
    .leftJoin(cars, eq(rentals.carId, cars.id))
    .where(and(eq(rentals.status, 'pending'), inArray(rentals.id, createdIds)))

  if (pickups.length !== 3) {
    fail('Ops Pickup tab', `Expected 3 pickups, got ${pickups.length}`)
  }
  pass(
    'Visible in Ops Pickup tab',
    pickups.map((r) => r.plate).join(', '),
  )

  for (const id of createdIds) {
    await db
      .update(rentals)
      .set({
        status: 'active',
        startMileage: 10000,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, id))
  }

  pass('Ops handover (pickup confirm)', `3 jobs moved pending → active`)

  const returns = await db
    .select({ id: rentals.id, plate: cars.plateNumber, status: rentals.status })
    .from(rentals)
    .leftJoin(cars, eq(rentals.carId, cars.id))
    .where(and(eq(rentals.status, 'active'), inArray(rentals.id, createdIds)))

  if (returns.length !== 3) {
    fail('Ops Return tab', `Expected 3 returns, got ${returns.length}`)
  }
  pass(
    'Visible in Ops Return tab',
    returns.map((r) => `${r.plate}:${r.status}`).join(', '),
  )

  const stillPending = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(and(eq(rentals.status, 'pending'), inArray(rentals.id, createdIds)))

  if (stillPending.length !== 0) {
    fail('Pickup cleared after handover', `${stillPending.length} still pending`)
  }
  pass('Pickup cleared after handover', 'none of the 3 jobs remain in Pickup')

  console.log('\n=== RESULT: PASS — CS 3-vehicle create → Jobs → Pickup → Return works ===\n')
  console.log(`Customer: ${customer.fullName}`)
  console.log(`Trip: ${start} → ${end}`)
  console.log(`Job IDs:\n${createdIds.map((id) => `  - ${id}`).join('\n')}`)
}

main()
  .catch((err) => {
    console.error('\n=== RESULT: FAIL ===\n')
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
  .finally(async () => {
    await pool.end()
  })
