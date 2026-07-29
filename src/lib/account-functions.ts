import { createServerFn } from '@tanstack/react-start'
import { desc, eq, inArray, sql } from 'drizzle-orm'

import { cars, customers, refunds, rentals } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, type AppRole } from '#/lib/auth-model'

export type AccountJobRow = {
  rentalId: string
  status: string
  paymentStatus: string
  customerName: string | null
  customerPhone: string | null
  carLabel: string
  plateNumber: string | null
  startDate: string
  endDate: string
  totalAmountSen: number
  paidAmountSen: number
  outstandingSen: number
  depositAmountSen: number
  depositPaidSen: number
  depositRefundedSen: number
  depositPendingSen: number
  fuelFeeSen: number
  actualPickupAt: string | null
  actualReturnDate: string | null
}

export const listJobsForAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AccountJobRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const rows = await db
      .select({
        rentalId: rentals.id,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        customerName: customers.fullName,
        customerPhone: customers.phone,
        make: cars.make,
        model: cars.model,
        plateNumber: cars.plateNumber,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        depositPaidSen: rentals.depositPaidSen,
        fuelFeeSen: rentals.fuelFeeSen,
        actualPickupAt: rentals.actualPickupAt,
        actualReturnDate: rentals.actualReturnDate,
        refundedSen: sql<number>`coalesce((
          select sum(r.amount_sen)::int from refunds r
          where r.rental_id = ${rentals.id} and r.status = 'paid'
        ), 0)`,
      })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .where(
        inArray(rentals.paymentStatus, ['partial', 'paid']),
      )
      .orderBy(desc(rentals.updatedAt))
      .limit(200)

    return rows.map((row) => ({
      rentalId: row.rentalId,
      status: row.status,
      paymentStatus: row.paymentStatus,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      carLabel: `${row.make ?? ''} ${row.model ?? ''}`.trim() || 'Vehicle',
      plateNumber: row.plateNumber,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      totalAmountSen: row.totalAmountSen,
      paidAmountSen: row.paidAmountSen,
      outstandingSen: Math.max(0, row.totalAmountSen - row.paidAmountSen),
      depositAmountSen: row.depositAmountSen,
      depositPaidSen: row.depositPaidSen,
      depositRefundedSen: Number(row.refundedSen),
      depositPendingSen: Math.max(0, row.depositPaidSen - Number(row.refundedSen)),
      fuelFeeSen: row.fuelFeeSen,
      actualPickupAt: row.actualPickupAt?.toISOString() ?? null,
      actualReturnDate: row.actualReturnDate?.toISOString() ?? null,
    }))
  },
)

export const processDepositRefund = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { rentalId: string; amountSen: number; notes?: string }) => input,
  )
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    if (!(data.amountSen > 0)) throw new Error('Refund amount must be positive.')

    const { db } = await import('#/db')
    const [rental] = await db
      .select({ id: rentals.id, status: rentals.status, depositPaidSen: rentals.depositPaidSen })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'closed')
      throw new Error('Deposit refunds can only be processed after the job is closed.')

    const [{ refundedSen }] = await db
      .select({ refundedSen: sql<number>`coalesce(sum(${refunds.amountSen}), 0)::int` })
      .from(refunds)
      .where(eq(refunds.rentalId, data.rentalId))
    const pending = rental.depositPaidSen - Number(refundedSen)
    if (data.amountSen > pending)
      throw new Error(`Refund exceeds the pending deposit (RM ${(pending / 100).toFixed(2)}).`)

    const [row] = await db
      .insert(refunds)
      .values({
        rentalId: data.rentalId,
        status: 'paid',
        amountSen: data.amountSen,
        reason: 'deposit',
        notes: data.notes?.trim() || null,
        requestedByUserId: roleSession.user.id,
        processedByUserId: roleSession.user.id,
        processedAt: new Date(),
      })
      .returning()

    try {
      const { recordAuditLog } = await import('#/lib/audit-log')
      await recordAuditLog({
        actorUserId: roleSession.user.id,
        actorRole: roleSession.user.role as AppRole,
        action: 'payment.refund',
        entityType: 'rental',
        entityId: data.rentalId,
        after: {
          refundId: row.id,
          reason: 'deposit',
          amountSen: data.amountSen,
          status: 'paid',
        },
      })
    } catch (err) {
      console.error('[audit] failed to record deposit refund', err)
    }

    return row
  })
