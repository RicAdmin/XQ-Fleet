/**
 * Verifies the Booked → Expired lifecycle end-to-end against the local DB:
 *  1. A pending job past its 72h window is swept to `expired` (audited).
 *  2. A pending job inside its window is untouched.
 *  3. A legacy pending row without a window gets backfilled from createdAt.
 *
 * Run: pnpm tsx scripts/verify-booking-lifecycle.ts
 */
import { eq } from 'drizzle-orm'

import { db } from '../src/db'
import { cars, customers, rentals } from '../src/db/schema'
import { expireStaleBookings } from '../src/lib/rental-functions'

async function main() {
  const [car] = await db.select({ id: cars.id }).from(cars).limit(1)
  const [customer] = await db.select({ id: customers.id }).from(customers).limit(1)
  if (!car || !customer) throw new Error('Seed data missing (need at least 1 car + 1 customer).')

  const mkRental = () => ({
    id: crypto.randomUUID(),
    carId: car.id,
    customerId: customer.id,
    type: 'walk-in' as const,
    status: 'pending' as const,
    paymentStatus: 'unpaid' as const,
    startDate: new Date(Date.now() + 7 * 86_400_000),
    endDate: new Date(Date.now() + 8 * 86_400_000),
    pickUpLocation: 'Office',
    returnLocation: 'Office',
    dailyRateSen: 10000,
    totalAmountSen: 10000,
    depositAmountSen: 0,
    paidAmountSen: 0,
  })

  const stale = mkRental()
  stale.bookingExpiresAt = new Date(Date.now() - 60_000) as never
  const fresh = mkRental()
  fresh.bookingExpiresAt = new Date(Date.now() + 86_400_000) as never
  const legacy = mkRental()
  // legacy: bookingExpiresAt null, createdAt 4 days ago → backfill then expire
  const ids = [stale.id, fresh.id, legacy.id]

  try {
    await db.insert(rentals).values([
      { ...stale, bookingExpiresAt: new Date(Date.now() - 60_000) },
      { ...fresh, bookingExpiresAt: new Date(Date.now() + 86_400_000) },
      legacy,
    ])
    await db
      .update(rentals)
      .set({ createdAt: new Date(Date.now() - 4 * 86_400_000) })
      .where(eq(rentals.id, legacy.id))

    await expireStaleBookings(db)

    const rows = await db
      .select({ id: rentals.id, status: rentals.status, bookingExpiresAt: rentals.bookingExpiresAt })
      .from(rentals)
      .where(eq(rentals.id, stale.id))
    const staleAfter = rows[0]
    const [freshAfter] = await db
      .select({ status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, fresh.id))
    const [legacyAfter] = await db
      .select({ status: rentals.status, bookingExpiresAt: rentals.bookingExpiresAt })
      .from(rentals)
      .where(eq(rentals.id, legacy.id))

    const checks: [string, boolean][] = [
      ['stale pending → expired', staleAfter?.status === 'expired'],
      ['fresh pending untouched', freshAfter?.status === 'pending'],
      ['legacy window backfilled', legacyAfter?.bookingExpiresAt !== null],
      ['legacy backfilled → expired', legacyAfter?.status === 'expired'],
    ]

    let failed = false
    for (const [label, ok] of checks) {
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
      if (!ok) failed = true
    }
    if (failed) process.exitCode = 1
  } finally {
    const { auditLog } = await import('../src/db/schema')
    const { inArray } = await import('drizzle-orm')
    await db.delete(auditLog).where(inArray(auditLog.entityId, ids))
    await db.delete(rentals).where(inArray(rentals.id, ids))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
