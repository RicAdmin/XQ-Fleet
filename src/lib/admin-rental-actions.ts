import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { cars, payments, refunds, rentals } from '#/db/schema'
import { requireAdmin } from '#/lib/auth-functions'
import { recordAuditLog } from '#/lib/audit-log'
import type { AppRole } from '#/lib/auth-model'
import {
  adminInputValidator,
  senAmount,
  trimmedString,
} from '#/lib/validation/admin-schemas'

// ─── cancelAdminBooking ──────────────────────────────────────────────────────

const cancelBookingSchema = z.object({
  rentalId: trimmedString(64),
  reason: trimmedString(1000).optional(),
})

export const cancelAdminBooking = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(cancelBookingSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [existing] = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    if (!existing) throw new Error('Rental not found.')
    if (existing.status === 'cancelled') {
      return { ok: true, alreadyCancelled: true }
    }
    if (existing.status === 'closed') {
      throw new Error('Cannot cancel a closed rental. Use refund instead.')
    }

    await db.transaction(async (tx) => {
      await tx
        .update(rentals)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(rentals.id, data.rentalId))

      // Release car hold if applicable.
      await tx
        .update(cars)
        .set({ status: 'available', updatedAt: new Date() })
        .where(and(eq(cars.id, existing.carId), eq(cars.status, 'payment-pending')))

      // Mark any pending payment attempts as voided.
      await tx
        .update(payments)
        .set({ status: 'voided', updatedAt: new Date() })
        .where(and(eq(payments.rentalId, data.rentalId), eq(payments.status, 'pending')))

      // Phase 3.6: void any pending affiliate attribution.
      try {
        const { flipAttributionForRentalStatus } = await import(
          '#/lib/affiliate-functions'
        )
        await flipAttributionForRentalStatus(tx, data.rentalId, 'cancelled')
      } catch {
        // attribution should never block cancel
      }

      await recordAuditLog(
        {
          actorUserId: session.user.id,
          actorRole: session.user.role as AppRole,
          action: 'booking.cancel',
          entityType: 'rental',
          entityId: data.rentalId,
          before: { status: existing.status },
          after: { status: 'cancelled', reason: data.reason ?? null },
        },
        tx,
      )
    })

    return { ok: true }
  })

// ─── requestAdminRefund ──────────────────────────────────────────────────────

const requestRefundSchema = z.object({
  rentalId: trimmedString(64),
  amountSen: senAmount,
  reason: trimmedString(1000).optional(),
})

export const requestAdminRefund = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(requestRefundSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [existing] = await db
      .select({
        id: rentals.id,
        paidAmountSen: rentals.paidAmountSen,
        status: rentals.status,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    if (!existing) throw new Error('Rental not found.')
    if (data.amountSen <= 0) throw new Error('Refund amount must be positive.')
    if (data.amountSen > existing.paidAmountSen) {
      throw new Error('Refund amount exceeds amount paid.')
    }

    const [refund] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(refunds)
        .values({
          rentalId: data.rentalId,
          status: 'requested',
          amountSen: data.amountSen,
          reason: data.reason ?? null,
          requestedByUserId: session.user.id,
        })
        .returning({ id: refunds.id })

      await recordAuditLog(
        {
          actorUserId: session.user.id,
          actorRole: session.user.role as AppRole,
          action: 'booking.refund_request',
          entityType: 'rental',
          entityId: data.rentalId,
          after: {
            refundId: created.id,
            amountSen: data.amountSen,
            reason: data.reason ?? null,
          },
        },
        tx,
      )

      return [created]
    })

    return { ok: true, refundId: refund.id }
  })

// ─── addAdminRentalNote ──────────────────────────────────────────────────────

const addNoteSchema = z.object({
  rentalId: trimmedString(64),
  body: trimmedString(4000),
})

export const addAdminRentalNote = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(addNoteSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')
    const { rentalNotes } = await import('#/db/schema')

    const [existing] = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    if (!existing) throw new Error('Rental not found.')

    const result = await db.transaction(async (tx) => {
      const [note] = await tx
        .insert(rentalNotes)
        .values({
          rentalId: data.rentalId,
          authorUserId: session.user.id,
          body: data.body,
        })
        .returning({ id: rentalNotes.id, createdAt: rentalNotes.createdAt })

      await recordAuditLog(
        {
          actorUserId: session.user.id,
          actorRole: session.user.role as AppRole,
          action: 'booking.note',
          entityType: 'rental',
          entityId: data.rentalId,
          after: { noteId: note.id, body: data.body },
        },
        tx,
      )

      return note
    })

    return { ok: true, noteId: result.id, createdAt: result.createdAt }
  })
