/**
 * 10 CS / Ops manual transactions against the live DB.
 *
 * Covers: job create, pickup handover, return/close + payment, cancel,
 * capacity enforcement (multi-unit vs single-unit), operations queue lenses,
 * and availability filtering.
 *
 * Run: pnpm tsx scripts/cs-ops-manual-transactions.ts
 */
import { config } from 'dotenv'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from '../src/db/schema.ts'
import { cars, customers, payments, rentals } from '../src/db/schema.ts'
import {
  assertCarHasBookingCapacity,
  getCarFleetCapacity,
  usesSingleUnitCarStatus,
} from '../src/lib/fleet-capacity.ts'
import {
  drizzleAvailableCarsForTripDb,
  listAvailableCarsForTrip,
} from '../src/lib/available-cars-for-trip.ts'

config({ path: ['.env.local', '.env'] })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: databaseUrl })
const db = drizzle(pool, { schema })

type StepResult = { ok: boolean; name: string; detail: string }

const results: StepResult[] = []
const createdRentalIds: string[] = []
const createdCustomerIds: string[] = []

function ymd(offsetDays: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`).getTime()
  const b = new Date(`${end}T00:00:00`).getTime()
  return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)))
}

function pass(name: string, detail: string) {
  results.push({ ok: true, name, detail })
  console.log(`✓ ${name} — ${detail}`)
}

function fail(name: string, detail: string) {
  results.push({ ok: false, name, detail })
  console.error(`✗ ${name} — ${detail}`)
}

async function createWalkIn(opts: {
  carId: string
  customerId: string
  start: string
  end: string
  dailyRateSen: number
  depositAmountSen?: number
}) {
  const startDate = new Date(`${opts.start}T00:00:00`)
  const endDate = new Date(`${opts.end}T00:00:00`)
  const days = daysBetween(opts.start, opts.end)
  const totalAmountSen = opts.dailyRateSen * days

  const fleetCapacity = await assertCarHasBookingCapacity(db, {
    carId: opts.carId,
    tripStart: startDate,
    tripEnd: endDate,
    errorMessage: 'This car already has a booking that overlaps with the selected dates.',
  })

  if (usesSingleUnitCarStatus(fleetCapacity)) {
    await db
      .update(cars)
      .set({ status: 'reserved', updatedAt: new Date() })
      .where(eq(cars.id, opts.carId))
  }

  const [row] = await db
    .insert(rentals)
    .values({
      carId: opts.carId,
      customerId: opts.customerId,
      type: 'walk-in',
      status: 'pending',
      paymentStatus: 'unpaid',
      startDate,
      endDate,
      dailyRateSen: opts.dailyRateSen,
      totalAmountSen,
      depositAmountSen: opts.depositAmountSen ?? 0,
      paidAmountSen: 0,
    })
    .returning()

  createdRentalIds.push(row.id)
  return row
}

async function confirmHandover(rentalId: string, startMileage: number) {
  const [rental] = await db
    .select({ id: rentals.id, carId: rentals.carId, status: rentals.status })
    .from(rentals)
    .where(eq(rentals.id, rentalId))
    .limit(1)

  if (!rental) throw new Error('Rental not found.')
  if (rental.status !== 'pending') throw new Error('Only pending rentals can be confirmed.')

  const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
  if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
    await db
      .update(cars)
      .set({ status: 'rented', updatedAt: new Date() })
      .where(eq(cars.id, rental.carId))
  }

  const [row] = await db
    .update(rentals)
    .set({
      status: 'active',
      startMileage,
      startConditionNote: 'CS/Ops manual test handover',
      updatedAt: new Date(),
    })
    .where(eq(rentals.id, rentalId))
    .returning()

  return row
}

async function closeReturn(
  rentalId: string,
  opts: { endMileage: number; paidAmountSen: number; flagDamage?: boolean },
) {
  const [rental] = await db
    .select({
      id: rentals.id,
      carId: rentals.carId,
      status: rentals.status,
      totalAmountSen: rentals.totalAmountSen,
    })
    .from(rentals)
    .where(eq(rentals.id, rentalId))
    .limit(1)

  if (!rental) throw new Error('Rental not found.')
  if (rental.status !== 'active') throw new Error('Only active rentals can be closed.')

  const now = new Date()
  const paymentStatus =
    opts.paidAmountSen <= 0
      ? 'unpaid'
      : opts.paidAmountSen >= rental.totalAmountSen
        ? 'paid'
        : 'partial'

  const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
  if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
    await db
      .update(cars)
      .set({
        status: opts.flagDamage ? 'damaged' : 'available',
        updatedAt: now,
      })
      .where(eq(cars.id, rental.carId))
  }

  const [row] = await db
    .update(rentals)
    .set({
      status: 'closed',
      paymentStatus,
      endMileage: opts.endMileage,
      endConditionNote: opts.flagDamage
        ? '[DAMAGE] Flagged on return (manual test)'
        : 'Returned OK (manual test)',
      paidAmountSen: opts.paidAmountSen,
      actualReturnDate: now,
      updatedAt: now,
    })
    .where(eq(rentals.id, rentalId))
    .returning()

  if (opts.paidAmountSen > 0) {
    await db.insert(payments).values({
      rentalId,
      provider: 'manual',
      amountSen: opts.paidAmountSen,
      status: 'successful',
      paymentMethod: 'cash',
      respondedAt: now,
    })
  }

  return row
}

async function cancelPending(rentalId: string) {
  const [rental] = await db
    .select({ id: rentals.id, carId: rentals.carId, status: rentals.status })
    .from(rentals)
    .where(eq(rentals.id, rentalId))
    .limit(1)

  if (!rental) throw new Error('Rental not found.')
  if (rental.status !== 'pending') throw new Error('Only pending rentals can be cancelled.')

  const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
  if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
    await db
      .update(cars)
      .set({ status: 'available', updatedAt: new Date() })
      .where(eq(cars.id, rental.carId))
  }

  const [row] = await db
    .update(rentals)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(rentals.id, rentalId))
    .returning()

  return row
}

async function operationsQueue() {
  const base = () =>
    db
      .select({
        id: rentals.id,
        status: rentals.status,
        plate: cars.plateNumber,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))

  const [pickups, returns, all] = await Promise.all([
    base().where(eq(rentals.status, 'pending')).orderBy(asc(rentals.startDate)),
    base().where(eq(rentals.status, 'active')).orderBy(asc(rentals.endDate)),
    base()
      .where(inArray(rentals.status, ['pending', 'active']))
      .orderBy(asc(rentals.startDate)),
  ])

  return { pickups, returns, all }
}

async function main() {
  console.log('\n=== CS / Ops — 10 manual transactions ===\n')

  const multiUnit = await db
    .select()
    .from(cars)
    .where(eq(cars.plateNumber, 'DEMO001'))
    .limit(1)
  const singleUnit = await db
    .select()
    .from(cars)
    .where(eq(cars.plateNumber, 'DEMO016'))
    .limit(1)
  const jimny = await db
    .select()
    .from(cars)
    .where(eq(cars.plateNumber, 'DEMO008'))
    .limit(1)

  if (!multiUnit[0] || !singleUnit[0] || !jimny[0]) {
    throw new Error('Required demo cars DEMO001 / DEMO016 / DEMO008 not found.')
  }

  // Ensure single-unit Mini is available for clean capacity tests.
  if (singleUnit[0].status !== 'available') {
    await db
      .update(cars)
      .set({ status: 'available', updatedAt: new Date() })
      .where(eq(cars.id, singleUnit[0].id))
  }

  const stamp = Date.now()
  const [csCustomer] = await db
    .insert(customers)
    .values({
      fullName: `CS Test ${stamp}`,
      email: `cs-test-${stamp}@xqcar.test`,
      phone: '0120000001',
      icOrPassport: `CSTEST${stamp}`,
    })
    .returning()
  const [opsCustomer] = await db
    .insert(customers)
    .values({
      fullName: `Ops Test ${stamp}`,
      email: `ops-test-${stamp}@xqcar.test`,
      phone: '0120000002',
      icOrPassport: `OPSTEST${stamp}`,
    })
    .returning()
  createdCustomerIds.push(csCustomer.id, opsCustomer.id)

  const start = ymd(2)
  const end = ymd(5)
  const startB = ymd(2)
  const endB = ymd(4)

  // ── 1. CS creates multi-unit walk-in job ──────────────────────────────────
  try {
    const job = await createWalkIn({
      carId: multiUnit[0].id,
      customerId: csCustomer.id,
      start,
      end,
      dailyRateSen: multiUnit[0].dailyRateSen,
      depositAmountSen: 20000,
    })
    const [carAfter] = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, multiUnit[0].id))
    if (job.status !== 'pending') throw new Error(`Expected pending, got ${job.status}`)
    if (carAfter.status !== 'available') {
      throw new Error(`Multi-unit car should stay available, got ${carAfter.status}`)
    }
    pass(
      'T1 CS create multi-unit walk-in',
      `job ${job.id.slice(0, 8)} Axia pending, car stays available`,
    )
  } catch (err) {
    fail('T1 CS create multi-unit walk-in', err instanceof Error ? err.message : String(err))
  }

  // ── 2. CS creates single-unit walk-in job (reserves car) ──────────────────
  let singleJobId = ''
  try {
    const job = await createWalkIn({
      carId: singleUnit[0].id,
      customerId: opsCustomer.id,
      start,
      end,
      dailyRateSen: singleUnit[0].dailyRateSen,
      depositAmountSen: 50000,
    })
    singleJobId = job.id
    const [carAfter] = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, singleUnit[0].id))
    if (carAfter.status !== 'reserved') {
      throw new Error(`Single-unit car should be reserved, got ${carAfter.status}`)
    }
    pass(
      'T2 CS create single-unit walk-in',
      `job ${job.id.slice(0, 8)} Mini reserved`,
    )
  } catch (err) {
    fail('T2 CS create single-unit walk-in', err instanceof Error ? err.message : String(err))
  }

  // ── 3. Ops pickup (handover) multi-unit job ───────────────────────────────
  let multiActiveId = createdRentalIds[0] ?? ''
  try {
    if (!multiActiveId) throw new Error('Missing T1 job')
    const job = await confirmHandover(multiActiveId, 12000)
    const [carAfter] = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, multiUnit[0].id))
    if (job.status !== 'active') throw new Error(`Expected active, got ${job.status}`)
    if (carAfter.status !== 'available') {
      throw new Error(`Multi-unit car should stay available after pickup, got ${carAfter.status}`)
    }
    pass('T3 Ops pickup multi-unit', `job → active, car stays available`)
  } catch (err) {
    fail('T3 Ops pickup multi-unit', err instanceof Error ? err.message : String(err))
  }

  // ── 4. Ops pickup single-unit job → rented ────────────────────────────────
  try {
    if (!singleJobId) throw new Error('Missing T2 job')
    const job = await confirmHandover(singleJobId, 4500)
    const [carAfter] = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, singleUnit[0].id))
    if (job.status !== 'active') throw new Error(`Expected active, got ${job.status}`)
    if (carAfter.status !== 'rented') {
      throw new Error(`Single-unit car should be rented, got ${carAfter.status}`)
    }
    pass('T4 Ops pickup single-unit', `job → active, Mini → rented`)
  } catch (err) {
    fail('T4 Ops pickup single-unit', err instanceof Error ? err.message : String(err))
  }

  // ── 5. CS second overlapping job on multi-unit Axia (capacity 10) ─────────
  try {
    const job = await createWalkIn({
      carId: multiUnit[0].id,
      customerId: opsCustomer.id,
      start: startB,
      end: endB,
      dailyRateSen: multiUnit[0].dailyRateSen,
    })
    if (job.status !== 'pending') throw new Error(`Expected pending, got ${job.status}`)
    pass(
      'T5 CS second multi-unit overlap',
      `second Axia job allowed (capacity 10)`,
    )
  } catch (err) {
    fail('T5 CS second multi-unit overlap', err instanceof Error ? err.message : String(err))
  }

  // ── 6. CS overlapping job on single-unit Mini must fail ───────────────────
  try {
    await createWalkIn({
      carId: singleUnit[0].id,
      customerId: csCustomer.id,
      start: startB,
      end: endB,
      dailyRateSen: singleUnit[0].dailyRateSen,
    })
    fail('T6 CS block single-unit overbook', 'Expected capacity error, but job was created')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('overlap') || msg.toLowerCase().includes('available')) {
      pass('T6 CS block single-unit overbook', msg)
    } else {
      fail('T6 CS block single-unit overbook', `Unexpected error: ${msg}`)
    }
  }

  // ── 7. Ops return + full payment on multi-unit job ────────────────────────
  try {
    if (!multiActiveId) throw new Error('Missing active multi-unit job')
    const [before] = await db
      .select({ totalAmountSen: rentals.totalAmountSen })
      .from(rentals)
      .where(eq(rentals.id, multiActiveId))
    const job = await closeReturn(multiActiveId, {
      endMileage: 12450,
      paidAmountSen: before.totalAmountSen,
    })
    const paymentRows = await db
      .select({ amountSen: payments.amountSen, status: payments.status })
      .from(payments)
      .where(eq(payments.rentalId, multiActiveId))
    if (job.status !== 'closed' || job.paymentStatus !== 'paid') {
      throw new Error(`Expected closed/paid, got ${job.status}/${job.paymentStatus}`)
    }
    if (!paymentRows.some((p) => p.status === 'successful' && p.amountSen === before.totalAmountSen)) {
      throw new Error('Manual payment row missing')
    }
    pass('T7 Ops return + full payment', `closed/paid + payment recorded`)
  } catch (err) {
    fail('T7 Ops return + full payment', err instanceof Error ? err.message : String(err))
  }

  // ── 8. CS cancel pending Jimny job → restores available (capacity 2) ──────
  try {
    const pending = await createWalkIn({
      carId: jimny[0].id,
      customerId: csCustomer.id,
      start: ymd(10),
      end: ymd(12),
      dailyRateSen: jimny[0].dailyRateSen,
    })
    // Jimny capacity=2 → not single-unit; status should stay available.
    const cancelled = await cancelPending(pending.id)
    if (cancelled.status !== 'cancelled') {
      throw new Error(`Expected cancelled, got ${cancelled.status}`)
    }
    const [carAfter] = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, jimny[0].id))
    if (carAfter.status !== 'available') {
      throw new Error(`Jimny should remain available, got ${carAfter.status}`)
    }
    pass('T8 CS cancel pending job', `Jimny job cancelled, car available`)
  } catch (err) {
    fail('T8 CS cancel pending job', err instanceof Error ? err.message : String(err))
  }

  // ── 9. Ops return single-unit with damage flag → car damaged ──────────────
  try {
    if (!singleJobId) throw new Error('Missing single-unit job')
    const [before] = await db
      .select({ totalAmountSen: rentals.totalAmountSen, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, singleJobId))
    if (before.status !== 'active') throw new Error(`Expected active before damage return, got ${before.status}`)
    const job = await closeReturn(singleJobId, {
      endMileage: 4700,
      paidAmountSen: Math.floor(before.totalAmountSen / 2),
      flagDamage: true,
    })
    const [carAfter] = await db
      .select({ status: cars.status })
      .from(cars)
      .where(eq(cars.id, singleUnit[0].id))
    if (job.paymentStatus !== 'partial') {
      throw new Error(`Expected partial payment, got ${job.paymentStatus}`)
    }
    if (carAfter.status !== 'damaged') {
      throw new Error(`Expected damaged, got ${carAfter.status}`)
    }
    // Restore Mini to available for future demos.
    await db
      .update(cars)
      .set({ status: 'available', updatedAt: new Date() })
      .where(eq(cars.id, singleUnit[0].id))
    pass('T9 Ops return with damage', `partial payment + Mini flagged damaged (restored after assert)`)
  } catch (err) {
    fail('T9 Ops return with damage', err instanceof Error ? err.message : String(err))
  }

  // ── 10. Operations queue lenses + availability ────────────────────────────
  try {
    const queue = await operationsQueue()
    const pickupIds = new Set(queue.pickups.map((r) => r.id))
    const returnIds = new Set(queue.returns.map((r) => r.id))
    const allIds = new Set(queue.all.map((r) => r.id))

    for (const id of pickupIds) {
      if (!allIds.has(id)) throw new Error('Pickup missing from All lens')
    }
    for (const id of returnIds) {
      if (!allIds.has(id)) throw new Error('Return missing from All lens')
    }
    if (allIds.size !== pickupIds.size + returnIds.size) {
      // All should be pending ∪ active with no duplicates
      throw new Error(
        `All=${allIds.size} != pickups(${pickupIds.size})+returns(${returnIds.size})`,
      )
    }

    const tripDb = drizzleAvailableCarsForTripDb(db)
    const available = await listAvailableCarsForTrip(tripDb, {
      startDate: start,
      endDate: end,
    })
    const availableIds = new Set(available.map((c) => c.id))
    // Active single-unit Mini (if still open) or capacity-full cars should be excluded;
    // Axia multi-unit with open jobs below capacity should still appear.
    if (!availableIds.has(multiUnit[0].id)) {
      throw new Error('Axia should still be available for trip (under capacity)')
    }

    pass(
      'T10 Ops queue + availability',
      `pickups=${queue.pickups.length} returns=${queue.returns.length} all=${queue.all.length}; Axia listed available`,
    )
  } catch (err) {
    fail('T10 Ops queue + availability', err instanceof Error ? err.message : String(err))
  }

  // ── Cleanup test customers' leftover open jobs (keep history for audit) ───
  // Leave closed/cancelled rows; cancel any leftover pending from this run.
  for (const id of createdRentalIds) {
    const [row] = await db
      .select({ status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, id))
      .limit(1)
    if (row?.status === 'pending') {
      try {
        await cancelPending(id)
      } catch {
        // ignore
      }
    }
  }

  const failed = results.filter((r) => !r.ok)
  console.log('\n=== Summary ===')
  console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`)
  if (failed.length) {
    console.log('Failed:')
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`)
  }
  console.log('')

  await pool.end()
  process.exit(failed.length ? 1 : 0)
}

main().catch(async (err) => {
  console.error(err)
  await pool.end()
  process.exit(1)
})
