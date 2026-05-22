import { createServerFn } from '@tanstack/react-start'

import type { PaymentMode } from '#/db/schema'
import { getRequestSession } from '#/lib/auth-functions'
import { fullAdminRoles } from '#/lib/auth-model'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentSettingsRow = {
  paymentMode: PaymentMode
  depositAmountSen: number
  sandboxMode: boolean
  enabled: boolean
}

type UpdatePaymentSettingsInput = {
  paymentMode: PaymentMode
  depositAmountSen: number
  sandboxMode: boolean
  enabled: boolean
}

// ─── Get payment settings ─────────────────────────────────────────────────────

export const getPaymentSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PaymentSettingsRow> => {
    const { db } = await import('#/db')
    const { paymentSettings } = await import('#/db/schema')

    const [row] = await db.select().from(paymentSettings).where(undefined).limit(1)

    // Return defaults if no settings row exists yet
    if (!row) {
      return { paymentMode: 'full', depositAmountSen: 0, sandboxMode: true, enabled: false }
    }

    return {
      paymentMode: row.paymentMode,
      depositAmountSen: row.depositAmountSen,
      sandboxMode: row.sandboxMode,
      enabled: row.enabled,
    }
  },
)

// ─── Update payment settings (owner only) ────────────────────────────────────

export const updatePaymentSettings = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdatePaymentSettingsInput) => input)
  .handler(async ({ data }): Promise<void> => {
    const session = await getRequestSession()
    if (!session || !fullAdminRoles.includes(session.user.role)) {
      throw new Error('Forbidden')
    }

    const { db } = await import('#/db')
    const { paymentSettings } = await import('#/db/schema')
    const { sql } = await import('drizzle-orm')

    await db
      .insert(paymentSettings)
      .values({
        id: 1,
        paymentMode: data.paymentMode,
        depositAmountSen: data.depositAmountSen,
        sandboxMode: data.sandboxMode,
        enabled: data.enabled,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: paymentSettings.id,
        set: {
          paymentMode: sql`excluded.payment_mode`,
          depositAmountSen: sql`excluded.deposit_amount_sen`,
          sandboxMode: sql`excluded.sandbox_mode`,
          enabled: sql`excluded.enabled`,
          updatedAt: sql`excluded.updated_at`,
        },
      })
  })
