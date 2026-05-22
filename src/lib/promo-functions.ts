import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, ilike, lt, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { customers, promoRedemptions, promos } from '#/db/schema'
import type { CarCategory, Promo } from '#/db/schema'
import { requireAdmin } from '#/lib/auth-functions'
import { recordAuditLog } from '#/lib/audit-log'
import type { AppRole } from '#/lib/auth-model'
import type {
  ApplyPromoResult,
  CouponCartContext,
  FullPromoRecord,
} from '#/lib/pricing-logic'
import { applyPromoV2 } from '#/lib/pricing-logic'
import {
  adminInputValidator,
  affiliateCodeSchema as _affiliateCodeSchema,
  optionalTrimmedString,
  paginationSchema,
  percentInt,
  promoCodeSchema,
  senAmount,
  trimmedString,
  uuidString,
} from '#/lib/validation/admin-schemas'

// Silence unused import warning (kept available for affiliate-side use).
void _affiliateCodeSchema

// ─── Helpers ──────────────────────────────────────────────────────────────────

const carCategoryValues = ['economy', 'mpv', 'suv', 'other'] as const

function promoRowToFullRecord(p: Promo): FullPromoRecord {
  return {
    id: p.id,
    code: p.code,
    discountType: p.discountType,
    discountValueSen: p.discountValueSen,
    maxRedemptions: p.maxRedemptions,
    redemptionsUsed: p.redemptionsUsed,
    perUserLimit: p.perUserLimit,
    minBookingAmountSen: p.minBookingAmountSen,
    applicableCarCategories: p.applicableCarCategories ?? [],
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    isActive: p.isActive,
    stackableWithAffiliate: p.stackableWithAffiliate,
  }
}

async function findPromoByCode(
  dbClient: Awaited<typeof import('#/db')>['db'],
  code: string,
): Promise<Promo | null> {
  const normalized = code.trim().toUpperCase()
  const [row] = await dbClient
    .select()
    .from(promos)
    .where(eq(promos.code, normalized))
    .limit(1)
  return row ?? null
}

// ─── 2.3 — validatePromo ──────────────────────────────────────────────────────

const cartContextSchema = z.object({
  carId: uuidString.optional(),
  carCategory: z.enum(carCategoryValues).optional(),
  subTotalSen: senAmount,
  customerEmail: z.string().email().optional(),
  customerAuthUserId: z.string().optional(),
})

const validatePromoSchema = z.object({
  code: promoCodeSchema,
  cartContext: cartContextSchema,
})

export type ValidatePromoResult =
  | {
      valid: true
      promoId: string
      code: string
      discountSen: number
      discountPercent: number
    }
  | { valid: false; reason: string; errorCode?: string }

function couponErrorToMessage(err: string): string {
  switch (err) {
    case 'not-found':
      return 'Promo code not found.'
    case 'expired':
      return 'This promo has expired.'
    case 'inactive':
      return 'This promo is no longer active.'
    case 'scheduled':
      return 'This promo is not yet active.'
    case 'exhausted':
      return 'This promo has reached its redemption limit.'
    case 'min-amount':
      return 'Booking total is below the promo minimum.'
    case 'category':
      return 'This promo does not apply to the selected car.'
    case 'per-user-limit':
      return 'You have already used this promo the maximum number of times.'
    default:
      return 'Promo cannot be applied.'
  }
}

export const validatePromo = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(validatePromoSchema))
  .handler(async ({ data }): Promise<ValidatePromoResult> => {
    const { db } = await import('#/db')

    const promo = await findPromoByCode(db, data.code)
    if (!promo) {
      return { valid: false, reason: couponErrorToMessage('not-found'), errorCode: 'not-found' }
    }

    // Count prior redemptions for the per-user limit.
    let redemptionsByThisCustomer = 0
    if (promo.perUserLimit != null) {
      if (data.cartContext.customerAuthUserId) {
        const [row] = await db
          .select({ c: count() })
          .from(promoRedemptions)
          .where(
            and(
              eq(promoRedemptions.promoId, promo.id),
              eq(promoRedemptions.userId, data.cartContext.customerAuthUserId),
            ),
          )
        redemptionsByThisCustomer = Number(row?.c ?? 0)
      } else if (data.cartContext.customerEmail) {
        const [row] = await db
          .select({ c: count() })
          .from(promoRedemptions)
          .where(
            and(
              eq(promoRedemptions.promoId, promo.id),
              eq(promoRedemptions.customerEmail, data.cartContext.customerEmail),
            ),
          )
        redemptionsByThisCustomer = Number(row?.c ?? 0)
      }
    }

    const ctx: CouponCartContext = {
      subTotalRm: data.cartContext.subTotalSen / 100,
      carCategory: data.cartContext.carCategory,
      redemptionsByThisCustomer,
    }

    const result: ApplyPromoResult = applyPromoV2(
      data.code,
      promoRowToFullRecord(promo),
      ctx,
    )

    if (!result.ok) {
      return {
        valid: false,
        reason: couponErrorToMessage(result.error),
        errorCode: result.error,
      }
    }

    return {
      valid: true,
      promoId: promo.id,
      code: promo.code,
      discountSen: result.discountSen,
      discountPercent: result.discountPercent,
    }
  })

// ─── 2.4 — redeemPromo (atomic, in tx) ────────────────────────────────────────
//
// Returns null if the atomic UPDATE finds no row (max_redemptions hit). The
// caller is expected to throw inside the enclosing transaction so it rolls
// back.

export type RedeemPromoInput = {
  promoId: string
  rentalId: string
  customerId: string | null
  userId: string | null
  customerEmail: string | null
  amountDiscountedSen: number
}

export type RedeemPromoResult = { ok: true } | { ok: false; reason: 'exhausted' }

export async function redeemPromoInTx(
  tx: Awaited<typeof import('#/db')>['db'],
  input: RedeemPromoInput,
): Promise<RedeemPromoResult> {
  // Atomic increment: only succeeds if the row is unlimited OR has slots left.
  const result = await tx
    .update(promos)
    .set({
      redemptionsUsed: sql`${promos.redemptionsUsed} + 1`,
      // Mirror to legacy `usage_left` if non-null (kept until backfill drop).
      usageLeft: sql`GREATEST(${promos.usageLeft} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(promos.id, input.promoId),
        eq(promos.isActive, true),
        or(
          sql`${promos.maxRedemptions} IS NULL`,
          lt(promos.redemptionsUsed, promos.maxRedemptions),
        ),
      ),
    )
    .returning({ id: promos.id })

  if (result.length === 0) {
    return { ok: false, reason: 'exhausted' }
  }

  await tx.insert(promoRedemptions).values({
    promoId: input.promoId,
    rentalId: input.rentalId,
    customerId: input.customerId ?? null,
    userId: input.userId ?? null,
    customerEmail: input.customerEmail ?? null,
    amountDiscountedSen: input.amountDiscountedSen,
  })

  return { ok: true }
}

// ─── 2.6 — Promo CRUD ────────────────────────────────────────────────────────

// Plain object (no refinements) so we can call `.partial()` on it for the
// update path. The cross-field refinements live below in `promoRefine` and are
// applied to the full and partial shapes via `.superRefine`.
const promoBaseShape = z.object({
  code: promoCodeSchema,
  discountType: z.enum(['percent', 'fixed']),
  discountValueSen: senAmount,
  maxRedemptions: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  minBookingAmountSen: senAmount.optional(),
  applicableCarCategories: z.array(z.enum(carCategoryValues)).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  stackableWithAffiliate: z.boolean().optional(),
})

function promoRefine(
  val: {
    discountType?: 'percent' | 'fixed'
    discountValueSen?: number
    startsAt?: string | null
    endsAt?: string | null
  },
  ctx: z.RefinementCtx,
) {
  if (val.discountType === 'percent' && val.discountValueSen != null) {
    const pct = percentInt.safeParse(val.discountValueSen)
    if (!pct.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['discountValueSen'],
        message: 'Percent discount must be 0–100.',
      })
    }
  } else if (
    val.discountType === 'fixed' &&
    val.discountValueSen != null &&
    val.discountValueSen <= 0
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['discountValueSen'],
      message: 'Fixed discount must be > 0 sen.',
    })
  }
  if (val.startsAt && val.endsAt && val.endsAt <= val.startsAt) {
    ctx.addIssue({
      code: 'custom',
      path: ['endsAt'],
      message: 'endsAt must be after startsAt.',
    })
  }
}

const createPromoSchema = promoBaseShape.superRefine(promoRefine)
const updatePromoSchema = z.object({
  id: uuidString,
  patch: promoBaseShape.partial().superRefine(promoRefine),
})

export const createPromo = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(createPromoSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const normalizedCode = data.code.toUpperCase()
    const [created] = await db
      .insert(promos)
      .values({
        title: normalizedCode, // legacy mirror
        discount: String(data.discountType === 'percent' ? data.discountValueSen : 0),
        usageLeft: data.maxRedemptions ?? 0,
        code: normalizedCode,
        discountType: data.discountType,
        discountValueSen: data.discountValueSen,
        maxRedemptions: data.maxRedemptions ?? null,
        perUserLimit: data.perUserLimit ?? null,
        minBookingAmountSen: data.minBookingAmountSen ?? 0,
        applicableCarCategories: (data.applicableCarCategories ?? []) as CarCategory[],
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        isActive: data.isActive ?? true,
        stackableWithAffiliate: data.stackableWithAffiliate ?? false,
        createdByUserId: session.user.id,
      })
      .returning({ id: promos.id })

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'create',
      entityType: 'promo',
      entityId: created.id,
      after: { ...data, code: normalizedCode },
    })

    return { id: created.id }
  })

export const updatePromo = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(updatePromoSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [existing] = await db.select().from(promos).where(eq(promos.id, data.id)).limit(1)
    if (!existing) throw new Error('Promo not found.')

    const patch = data.patch
    const update: Partial<typeof promos.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (patch.code != null) {
      update.code = patch.code.toUpperCase()
      update.title = patch.code.toUpperCase()
    }
    if (patch.discountType != null) update.discountType = patch.discountType
    if (patch.discountValueSen != null) update.discountValueSen = patch.discountValueSen
    if (patch.maxRedemptions !== undefined) update.maxRedemptions = patch.maxRedemptions
    if (patch.perUserLimit !== undefined) update.perUserLimit = patch.perUserLimit
    if (patch.minBookingAmountSen != null) update.minBookingAmountSen = patch.minBookingAmountSen
    if (patch.applicableCarCategories != null) {
      update.applicableCarCategories = patch.applicableCarCategories as CarCategory[]
    }
    if (patch.startsAt !== undefined) {
      update.startsAt = patch.startsAt ? new Date(patch.startsAt) : null
    }
    if (patch.endsAt !== undefined) {
      update.endsAt = patch.endsAt ? new Date(patch.endsAt) : null
    }
    if (patch.isActive != null) update.isActive = patch.isActive
    if (patch.stackableWithAffiliate != null) {
      update.stackableWithAffiliate = patch.stackableWithAffiliate
    }

    await db.update(promos).set(update).where(eq(promos.id, data.id))

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'update',
      entityType: 'promo',
      entityId: data.id,
      before: existing,
      after: update,
    })

    return { ok: true }
  })

const deactivatePromoSchema = z.object({ id: uuidString })

export const deactivatePromo = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(deactivatePromoSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [existing] = await db.select().from(promos).where(eq(promos.id, data.id)).limit(1)
    if (!existing) throw new Error('Promo not found.')

    await db
      .update(promos)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(promos.id, data.id))

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'deactivate',
      entityType: 'promo',
      entityId: data.id,
      before: { isActive: existing.isActive },
      after: { isActive: false },
    })

    return { ok: true }
  })

// ─── listPromos ──────────────────────────────────────────────────────────────

const listPromosSchema = paginationSchema.extend({
  filter: z.enum(['all', 'active', 'expired', 'exhausted', 'inactive']).default('all'),
  search: z.string().trim().max(120).optional(),
})

export type AdminPromoListRow = {
  id: string
  code: string
  discountType: 'percent' | 'fixed'
  discountValueSen: number
  redemptionsUsed: number
  maxRedemptions: number | null
  startsAt: Date | null
  endsAt: Date | null
  isActive: boolean
  createdAt: Date
}

export type AdminPromoListResult = {
  rows: AdminPromoListRow[]
  total: number
  page: number
  pageSize: number
}

export const listPromos = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listPromosSchema))
  .handler(async ({ data }): Promise<AdminPromoListResult> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const now = new Date()
    const filters = []
    if (data.filter === 'active') {
      filters.push(eq(promos.isActive, true))
    } else if (data.filter === 'inactive') {
      filters.push(eq(promos.isActive, false))
    } else if (data.filter === 'expired') {
      filters.push(and(sql`${promos.endsAt} IS NOT NULL`, lt(promos.endsAt, now))!)
    } else if (data.filter === 'exhausted') {
      filters.push(
        and(
          sql`${promos.maxRedemptions} IS NOT NULL`,
          sql`${promos.redemptionsUsed} >= ${promos.maxRedemptions}`,
        )!,
      )
    }
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(ilike(promos.code, needle))
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db
      .select({
        id: promos.id,
        code: promos.code,
        discountType: promos.discountType,
        discountValueSen: promos.discountValueSen,
        redemptionsUsed: promos.redemptionsUsed,
        maxRedemptions: promos.maxRedemptions,
        startsAt: promos.startsAt,
        endsAt: promos.endsAt,
        isActive: promos.isActive,
        createdAt: promos.createdAt,
      })
      .from(promos)

    const rowsPromise = whereClause
      ? baseQuery
          .where(whereClause)
          .orderBy(desc(promos.createdAt))
          .limit(data.pageSize)
          .offset(offset)
      : baseQuery.orderBy(desc(promos.createdAt)).limit(data.pageSize).offset(offset)

    const countBase = db.select({ count: sql<number>`count(*)::int` }).from(promos)
    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countRow] = await Promise.all([rowsPromise, countPromise])

    return {
      rows: rows as AdminPromoListRow[],
      total: Number(countRow[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
    }
  })

// ─── getPromoDetail (with redemptions) ────────────────────────────────────────

const getPromoDetailSchema = z.object({ id: uuidString })

export type AdminPromoRedemptionRow = {
  id: string
  amountDiscountedSen: number
  redeemedAt: Date
  rentalId: string
  customerEmail: string | null
  customerFullName: string | null
}

export type AdminPromoDetail = {
  promo: Promo
  redemptions: AdminPromoRedemptionRow[]
}

export const getPromoDetail = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(getPromoDetailSchema))
  .handler(async ({ data }): Promise<AdminPromoDetail | null> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const [promo] = await db.select().from(promos).where(eq(promos.id, data.id)).limit(1)
    if (!promo) return null

    const rows = await db
      .select({
        id: promoRedemptions.id,
        amountDiscountedSen: promoRedemptions.amountDiscountedSen,
        redeemedAt: promoRedemptions.redeemedAt,
        rentalId: promoRedemptions.rentalId,
        customerEmail: promoRedemptions.customerEmail,
        customerFullName: customers.fullName,
      })
      .from(promoRedemptions)
      .leftJoin(customers, eq(promoRedemptions.customerId, customers.id))
      .where(eq(promoRedemptions.promoId, data.id))
      .orderBy(desc(promoRedemptions.redeemedAt))
      .limit(500)

    return { promo, redemptions: rows as AdminPromoRedemptionRow[] }
  })

// ─── 2.8 — bulkGeneratePromos ────────────────────────────────────────────────

const bulkGenerateSchema = z.object({
  prefix: trimmedString(16).regex(/^[A-Z0-9_-]+$/, 'Prefix must be A-Z, 0-9, -, _'),
  count: z.number().int().min(1).max(500),
  template: promoBaseShape.omit({ code: true }).superRefine(promoRefine),
})

function makeRandomSuffix(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // exclude lookalikes
  let out = ''
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export const bulkGeneratePromos = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(bulkGenerateSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const codes: string[] = []
    const inserted: { code: string; id: string }[] = []

    for (let i = 0; i < data.count; i++) {
      let code: string
      let attempts = 0
      do {
        code = `${data.prefix}-${makeRandomSuffix()}`
        attempts++
      } while (codes.includes(code) && attempts < 25)
      codes.push(code)
    }

    for (const code of codes) {
      try {
        const [row] = await db
          .insert(promos)
          .values({
            title: code,
            discount: String(
              data.template.discountType === 'percent' ? data.template.discountValueSen : 0,
            ),
            usageLeft: data.template.maxRedemptions ?? 0,
            code,
            discountType: data.template.discountType,
            discountValueSen: data.template.discountValueSen,
            maxRedemptions: data.template.maxRedemptions ?? null,
            perUserLimit: data.template.perUserLimit ?? null,
            minBookingAmountSen: data.template.minBookingAmountSen ?? 0,
            applicableCarCategories: (data.template.applicableCarCategories ?? []) as CarCategory[],
            startsAt: data.template.startsAt ? new Date(data.template.startsAt) : null,
            endsAt: data.template.endsAt ? new Date(data.template.endsAt) : null,
            isActive: data.template.isActive ?? true,
            stackableWithAffiliate: data.template.stackableWithAffiliate ?? false,
            createdByUserId: session.user.id,
          })
          .returning({ id: promos.id, code: promos.code })
        inserted.push({ code: row.code, id: row.id })
      } catch {
        // Skip duplicates from extremely unlikely collisions.
        continue
      }
    }

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'bulk_generate',
      entityType: 'promo',
      entityId: `bulk:${data.prefix}`,
      after: { count: inserted.length, prefix: data.prefix },
    })

    return { generated: inserted }
  })

// Re-export utility for landing checkout (silences unused-import lint).
export { promoRowToFullRecord, findPromoByCode, couponErrorToMessage }
// Force optionalTrimmedString not to be tree-shaken before later phases need it.
void optionalTrimmedString
void asc
