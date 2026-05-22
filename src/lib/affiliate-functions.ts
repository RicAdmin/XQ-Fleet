import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, ilike, sql, sum } from 'drizzle-orm'
import { z } from 'zod'

import {
  affiliateAttributions,
  affiliateClicks,
  affiliatePayoutBatches,
  affiliates,
  customers,
  rentals,
} from '#/db/schema'
import type {
  Affiliate,
  AffiliateCommissionType,
} from '#/db/schema'
import { requireAdmin } from '#/lib/auth-functions'
import { recordAuditLog } from '#/lib/audit-log'
import type { AppRole } from '#/lib/auth-model'
import { writeAffiliateRefCookie } from '#/lib/affiliate-cookie.server'
import {
  adminInputValidator,
  affiliateCodeSchema,
  optionalTrimmedString,
  paginationSchema,
  senAmount,
  trimmedString,
  uuidString,
} from '#/lib/validation/admin-schemas'

void optionalTrimmedString

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function computeCommissionSen(
  commissionType: AffiliateCommissionType,
  commissionValueSen: number,
  paidAmountSen: number,
): number {
  if (paidAmountSen <= 0) return 0
  if (commissionType === 'fixed') {
    return Math.max(0, Math.min(commissionValueSen, paidAmountSen))
  }
  // percent — commissionValueSen stores whole percent (0-100)
  const pct = Math.max(0, Math.min(100, commissionValueSen))
  return Math.floor((paidAmountSen * pct) / 100)
}

export async function findAffiliateByCode(
  dbClient: Awaited<typeof import('#/db')>['db'],
  code: string,
): Promise<Affiliate | null> {
  const normalized = code.trim().toLowerCase()
  if (!normalized) return null
  const [row] = await dbClient
    .select()
    .from(affiliates)
    .where(eq(affiliates.code, normalized))
    .limit(1)
  return row ?? null
}

// ─── 3.3 — Record click + set cookie ─────────────────────────────────────────
//
// Used by the root-level `?ref=` capture and by `/r/$code`. Returns the
// affiliate row when found so callers can decide whether to redirect.

const captureAffiliateRefSchema = z.object({
  code: affiliateCodeSchema,
  landingPath: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional().nullable(),
})

export type CaptureAffiliateRefResult = {
  matched: boolean
  affiliateCode: string | null
}

export const captureAffiliateRef = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(captureAffiliateRefSchema))
  .handler(async ({ data }): Promise<CaptureAffiliateRefResult> => {
    const { db } = await import('#/db')
    const affiliate = await findAffiliateByCode(db, data.code)
    if (!affiliate || affiliate.status !== 'active') {
      return { matched: false, affiliateCode: null }
    }

    // Set the cookie first so the response carries it even if the click insert
    // fails for any reason.
    await writeAffiliateRefCookie(affiliate.code)

    // Best-effort insert; never block on it.
    try {
      const { getRequestHeaders } = await import('@tanstack/react-start/server')
      const headers = getRequestHeaders()
      const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
      const ua = headers.get('user-agent') ?? null
      await db.insert(affiliateClicks).values({
        affiliateId: affiliate.id,
        ipAddress: ip,
        userAgent: ua,
        referrer: data.referrer ?? null,
        landingPath: data.landingPath ?? null,
      })
    } catch {
      // Silently swallow — attribution still works because the cookie is set.
    }

    return { matched: true, affiliateCode: affiliate.code }
  })

// ─── 3.7 — Affiliate CRUD ────────────────────────────────────────────────────

const affiliateBaseSchema = z.object({
  name: trimmedString(120),
  type: z.enum(['individual', 'company']),
  email: z.string().email().trim().toLowerCase().max(254),
  code: affiliateCodeSchema,
  commissionType: z.enum(['percent', 'fixed']),
  commissionValueSen: senAmount,
  status: z.enum(['active', 'paused', 'archived']).optional(),
  payoutMethod: optionalTrimmedString(200),
  taxInfo: z.record(z.string(), z.unknown()).optional(),
})

const createAffiliateSchema = affiliateBaseSchema
const updateAffiliateSchema = z.object({
  id: uuidString,
  patch: affiliateBaseSchema.partial(),
})

export const createAffiliate = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(createAffiliateSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [created] = await db
      .insert(affiliates)
      .values({
        name: data.name,
        type: data.type,
        email: data.email,
        code: data.code,
        commissionType: data.commissionType,
        commissionValueSen: data.commissionValueSen,
        status: data.status ?? 'active',
        payoutMethod: data.payoutMethod ?? null,
        taxInfo: data.taxInfo ?? null,
        createdByUserId: session.user.id,
      })
      .returning({ id: affiliates.id })

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'create',
      entityType: 'affiliate',
      entityId: created.id,
      after: { ...data },
    })

    return { id: created.id }
  })

export const updateAffiliate = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(updateAffiliateSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [existing] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, data.id))
      .limit(1)
    if (!existing) throw new Error('Affiliate not found.')

    const patch = data.patch
    const update: Partial<typeof affiliates.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (patch.name != null) update.name = patch.name
    if (patch.type != null) update.type = patch.type
    if (patch.email != null) update.email = patch.email
    if (patch.code != null) update.code = patch.code
    if (patch.commissionType != null) update.commissionType = patch.commissionType
    if (patch.commissionValueSen != null) {
      update.commissionValueSen = patch.commissionValueSen
    }
    if (patch.status != null) update.status = patch.status
    if (patch.payoutMethod !== undefined) {
      update.payoutMethod = patch.payoutMethod ?? null
    }
    if (patch.taxInfo !== undefined) update.taxInfo = patch.taxInfo ?? null

    await db.update(affiliates).set(update).where(eq(affiliates.id, data.id))

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'update',
      entityType: 'affiliate',
      entityId: data.id,
      before: existing,
      after: update,
    })

    return { ok: true }
  })

const archiveAffiliateSchema = z.object({ id: uuidString })

export const archiveAffiliate = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(archiveAffiliateSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    const [existing] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.id, data.id))
      .limit(1)
    if (!existing) throw new Error('Affiliate not found.')

    await db
      .update(affiliates)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(affiliates.id, data.id))

    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: (session.user as { role: AppRole }).role,
      action: 'deactivate',
      entityType: 'affiliate',
      entityId: data.id,
      before: { status: existing.status },
      after: { status: 'archived' },
    })

    return { ok: true }
  })

// ─── 3.8 — List affiliates with lifetime stats ───────────────────────────────

const listAffiliatesSchema = paginationSchema.extend({
  status: z.enum(['all', 'active', 'paused', 'archived']).default('all'),
  search: z.string().trim().max(120).optional(),
})

export type AdminAffiliateListRow = {
  id: string
  name: string
  email: string
  code: string
  type: 'individual' | 'company'
  status: 'active' | 'paused' | 'archived'
  commissionType: 'percent' | 'fixed'
  commissionValueSen: number
  clicks: number
  bookings: number
  earnedSen: number
  paidSen: number
}

export type AdminAffiliateListResult = {
  rows: AdminAffiliateListRow[]
  total: number
  page: number
  pageSize: number
}

export const listAffiliates = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listAffiliatesSchema))
  .handler(async ({ data }): Promise<AdminAffiliateListResult> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const filters = []
    if (data.status !== 'all') {
      filters.push(eq(affiliates.status, data.status))
    }
    if (data.search) {
      const needle = `%${data.search.toLowerCase()}%`
      filters.push(
        sql`(${ilike(affiliates.name, needle)} OR ${ilike(affiliates.code, needle)} OR ${ilike(affiliates.email, needle)})`,
      )
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const offset = (data.page - 1) * data.pageSize

    const baseRows = db
      .select({
        id: affiliates.id,
        name: affiliates.name,
        email: affiliates.email,
        code: affiliates.code,
        type: affiliates.type,
        status: affiliates.status,
        commissionType: affiliates.commissionType,
        commissionValueSen: affiliates.commissionValueSen,
      })
      .from(affiliates)

    const rowsPromise = whereClause
      ? baseRows
          .where(whereClause)
          .orderBy(desc(affiliates.createdAt))
          .limit(data.pageSize)
          .offset(offset)
      : baseRows
          .orderBy(desc(affiliates.createdAt))
          .limit(data.pageSize)
          .offset(offset)

    const countBase = db.select({ c: sql<number>`count(*)::int` }).from(affiliates)
    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [baseList, countRow] = await Promise.all([rowsPromise, countPromise])

    if (baseList.length === 0) {
      return {
        rows: [],
        total: Number(countRow[0]?.c ?? 0),
        page: data.page,
        pageSize: data.pageSize,
      }
    }

    const ids = baseList.map((a) => a.id)

    // Aggregate clicks per affiliate.
    const clickRows = await db
      .select({
        affiliateId: affiliateClicks.affiliateId,
        c: count(),
      })
      .from(affiliateClicks)
      .where(sql`${affiliateClicks.affiliateId} = ANY(${ids})`)
      .groupBy(affiliateClicks.affiliateId)
    const clicksByAffiliate = new Map<string, number>(
      clickRows.map((r) => [r.affiliateId, Number(r.c)]),
    )

    // Aggregate bookings + earned + paid per affiliate.
    const attrRows = await db
      .select({
        affiliateId: affiliateAttributions.affiliateId,
        status: affiliateAttributions.status,
        commission: affiliateAttributions.commissionSen,
      })
      .from(affiliateAttributions)
      .where(sql`${affiliateAttributions.affiliateId} = ANY(${ids})`)

    const statsByAffiliate = new Map<
      string,
      { bookings: number; earnedSen: number; paidSen: number }
    >()
    for (const row of attrRows) {
      const stats = statsByAffiliate.get(row.affiliateId) ?? {
        bookings: 0,
        earnedSen: 0,
        paidSen: 0,
      }
      stats.bookings += 1
      if (row.status === 'earned') stats.earnedSen += row.commission
      if (row.status === 'paid') {
        stats.earnedSen += row.commission
        stats.paidSen += row.commission
      }
      statsByAffiliate.set(row.affiliateId, stats)
    }

    return {
      rows: baseList.map((a) => {
        const stats = statsByAffiliate.get(a.id) ?? {
          bookings: 0,
          earnedSen: 0,
          paidSen: 0,
        }
        return {
          ...a,
          clicks: clicksByAffiliate.get(a.id) ?? 0,
          bookings: stats.bookings,
          earnedSen: stats.earnedSen,
          paidSen: stats.paidSen,
        }
      }),
      total: Number(countRow[0]?.c ?? 0),
      page: data.page,
      pageSize: data.pageSize,
    }
  })

// ─── 3.10 — Affiliate detail (with monthly chart series) ─────────────────────

const getAffiliateDetailSchema = z.object({ id: uuidString })

export type AffiliateMonthlyPoint = {
  monthYmd: string // YYYY-MM-01
  attributedRevenueSen: number
  commissionSen: number
  bookings: number
}

export type AdminAffiliateAttributionRow = {
  id: string
  rentalId: string
  status: 'pending' | 'earned' | 'voided' | 'paid'
  commissionSen: number
  bookedAt: Date
  paidAt: Date | null
  customerName: string | null
}

export type AdminAffiliatePayoutRow = {
  id: string
  amountSen: number
  attributionCount: number
  paidAt: Date
  reference: string | null
}

// Public-facing affiliate row — drops the `taxInfo` JSON column to keep the
// wire-format JSON-serializable. The detail page only needs the basics.
export type AdminAffiliatePublic = Omit<Affiliate, 'taxInfo'>

export type AdminAffiliateDetail = {
  affiliate: AdminAffiliatePublic
  monthly: AffiliateMonthlyPoint[]
  attributions: AdminAffiliateAttributionRow[]
  payouts: AdminAffiliatePayoutRow[]
  totals: {
    clicks: number
    bookings: number
    pendingSen: number
    earnedSen: number
    paidSen: number
  }
}

export const getAffiliateDetail = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(getAffiliateDetailSchema))
  .handler(async ({ data }): Promise<AdminAffiliateDetail | null> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const [aff] = await db.select().from(affiliates).where(eq(affiliates.id, data.id)).limit(1)
    if (!aff) return null

    const [clicksRow] = await db
      .select({ c: count() })
      .from(affiliateClicks)
      .where(eq(affiliateClicks.affiliateId, aff.id))

    const attrJoinRows = await db
      .select({
        id: affiliateAttributions.id,
        rentalId: affiliateAttributions.rentalId,
        status: affiliateAttributions.status,
        commissionSen: affiliateAttributions.commissionSen,
        bookedAt: affiliateAttributions.bookedAt,
        paidAmountSen: rentals.paidAmountSen,
        totalAmountSen: rentals.totalAmountSen,
        customerName: customers.fullName,
        payoutBatchId: affiliateAttributions.payoutBatchId,
      })
      .from(affiliateAttributions)
      .innerJoin(rentals, eq(rentals.id, affiliateAttributions.rentalId))
      .leftJoin(customers, eq(customers.id, rentals.customerId))
      .where(eq(affiliateAttributions.affiliateId, aff.id))
      .orderBy(desc(affiliateAttributions.bookedAt))
      .limit(500)

    const payoutRows = await db
      .select({
        id: affiliatePayoutBatches.id,
        amountSen: affiliatePayoutBatches.amountSen,
        attributionCount: affiliatePayoutBatches.attributionCount,
        paidAt: affiliatePayoutBatches.paidAt,
        reference: affiliatePayoutBatches.reference,
      })
      .from(affiliatePayoutBatches)
      .where(eq(affiliatePayoutBatches.affiliateId, aff.id))
      .orderBy(desc(affiliatePayoutBatches.paidAt))

    // Build attribution rows with per-payout date.
    const payoutById = new Map<string, Date>(
      payoutRows.map((p) => [p.id, p.paidAt]),
    )
    const attributions: AdminAffiliateAttributionRow[] = attrJoinRows.map((r) => ({
      id: r.id,
      rentalId: r.rentalId,
      status: r.status,
      commissionSen: r.commissionSen,
      bookedAt: r.bookedAt,
      paidAt: r.payoutBatchId ? payoutById.get(r.payoutBatchId) ?? null : null,
      customerName: r.customerName ?? null,
    }))

    // Monthly series for the last 12 months.
    const now = new Date()
    const months: AffiliateMonthlyPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        monthYmd: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
        attributedRevenueSen: 0,
        commissionSen: 0,
        bookings: 0,
      })
    }
    const monthIndex = new Map<string, number>(months.map((m, idx) => [m.monthYmd, idx]))

    let pendingSen = 0
    let earnedSen = 0
    let paidSen = 0

    for (const r of attrJoinRows) {
      const date = r.bookedAt
      const ymd = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
      const idx = monthIndex.get(ymd)
      if (idx != null) {
        months[idx].attributedRevenueSen += r.paidAmountSen || r.totalAmountSen
        months[idx].commissionSen += r.commissionSen
        months[idx].bookings += 1
      }
      if (r.status === 'pending') pendingSen += r.commissionSen
      if (r.status === 'earned') earnedSen += r.commissionSen
      if (r.status === 'paid') {
        earnedSen += r.commissionSen
        paidSen += r.commissionSen
      }
    }

    const { taxInfo: _taxInfo, ...affPublic } = aff
    void _taxInfo

    return {
      affiliate: affPublic,
      monthly: months,
      attributions,
      payouts: payoutRows.map((p) => ({
        id: p.id,
        amountSen: p.amountSen,
        attributionCount: p.attributionCount,
        paidAt: p.paidAt,
        reference: p.reference,
      })),
      totals: {
        clicks: Number(clicksRow?.c ?? 0),
        bookings: attrJoinRows.length,
        pendingSen,
        earnedSen,
        paidSen,
      },
    }
  })

// ─── 3.6 — Attribution lifecycle helpers ─────────────────────────────────────
//
// These are called from rental-update paths so attribution status follows the
// rental status.

export async function flipAttributionForRentalStatus(
  dbClient: Awaited<typeof import('#/db')>['db'],
  rentalId: string,
  rentalStatus: string,
): Promise<void> {
  if (rentalStatus === 'closed' || rentalStatus === 'completed') {
    await dbClient
      .update(affiliateAttributions)
      .set({ status: 'earned', updatedAt: new Date() })
      .where(
        and(
          eq(affiliateAttributions.rentalId, rentalId),
          eq(affiliateAttributions.status, 'pending'),
        ),
      )
  } else if (rentalStatus === 'cancelled') {
    await dbClient
      .update(affiliateAttributions)
      .set({ status: 'voided', updatedAt: new Date() })
      .where(
        and(
          eq(affiliateAttributions.rentalId, rentalId),
          eq(affiliateAttributions.status, 'pending'),
        ),
      )
  }
}

// ─── 3.11 — Payout batch creation ────────────────────────────────────────────

const markPayoutBatchPaidSchema = z.object({
  affiliateId: uuidString,
  attributionIds: z.array(uuidString).min(1).max(500),
  reference: optionalTrimmedString(200),
})

export const markPayoutBatchPaid = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(markPayoutBatchPaidSchema))
  .handler(async ({ data }) => {
    const session = await requireAdmin()
    const { db } = await import('#/db')

    return await db.transaction(async (tx) => {
      // Verify all attributions belong to this affiliate and are status=earned.
      const rows = await tx
        .select({
          id: affiliateAttributions.id,
          status: affiliateAttributions.status,
          commissionSen: affiliateAttributions.commissionSen,
          affiliateId: affiliateAttributions.affiliateId,
        })
        .from(affiliateAttributions)
        .where(sql`${affiliateAttributions.id} = ANY(${data.attributionIds})`)

      if (rows.length !== data.attributionIds.length) {
        throw new Error('Some attributions could not be found.')
      }

      for (const r of rows) {
        if (r.affiliateId !== data.affiliateId) {
          throw new Error('Attribution does not belong to this affiliate.')
        }
        if (r.status !== 'earned') {
          throw new Error(`Attribution ${r.id} is not in earned status.`)
        }
      }

      const amountSen = rows.reduce((acc, r) => acc + r.commissionSen, 0)
      if (amountSen <= 0) {
        throw new Error('Total payout amount must be > 0.')
      }

      const [batch] = await tx
        .insert(affiliatePayoutBatches)
        .values({
          affiliateId: data.affiliateId,
          amountSen,
          attributionCount: rows.length,
          paidByUserId: session.user.id,
          reference: data.reference ?? null,
        })
        .returning({ id: affiliatePayoutBatches.id })

      await tx
        .update(affiliateAttributions)
        .set({
          status: 'paid',
          payoutBatchId: batch.id,
          updatedAt: new Date(),
        })
        .where(sql`${affiliateAttributions.id} = ANY(${data.attributionIds})`)

      await recordAuditLog({
        actorUserId: session.user.id,
        actorRole: (session.user as { role: AppRole }).role,
        action: 'affiliate.payout',
        entityType: 'affiliate',
        entityId: data.affiliateId,
        after: {
          batchId: batch.id,
          amountSen,
          attributionCount: rows.length,
          reference: data.reference ?? null,
        },
      })

      return { batchId: batch.id, amountSen, attributionCount: rows.length }
    })
  })

// ─── Earned-by-affiliate listing for payouts tab ─────────────────────────────

export type AdminEarnedGroup = {
  affiliateId: string
  affiliateName: string
  affiliateCode: string
  attributionCount: number
  pendingPayoutSen: number
  attributions: {
    id: string
    rentalId: string
    commissionSen: number
    bookedAt: Date
  }[]
}

export const getEarnedReadyForPayout = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(z.object({}).optional()))
  .handler(async (): Promise<AdminEarnedGroup[]> => {
    await requireAdmin()
    const { db } = await import('#/db')

    const rows = await db
      .select({
        affiliateId: affiliates.id,
        affiliateName: affiliates.name,
        affiliateCode: affiliates.code,
        attributionId: affiliateAttributions.id,
        rentalId: affiliateAttributions.rentalId,
        commissionSen: affiliateAttributions.commissionSen,
        bookedAt: affiliateAttributions.bookedAt,
      })
      .from(affiliateAttributions)
      .innerJoin(affiliates, eq(affiliates.id, affiliateAttributions.affiliateId))
      .where(eq(affiliateAttributions.status, 'earned'))
      .orderBy(affiliates.name, desc(affiliateAttributions.bookedAt))
      .limit(2000)

    const grouped = new Map<string, AdminEarnedGroup>()
    for (const r of rows) {
      let g = grouped.get(r.affiliateId)
      if (!g) {
        g = {
          affiliateId: r.affiliateId,
          affiliateName: r.affiliateName,
          affiliateCode: r.affiliateCode,
          attributionCount: 0,
          pendingPayoutSen: 0,
          attributions: [],
        }
        grouped.set(r.affiliateId, g)
      }
      g.attributionCount += 1
      g.pendingPayoutSen += r.commissionSen
      g.attributions.push({
        id: r.attributionId,
        rentalId: r.rentalId,
        commissionSen: r.commissionSen,
        bookedAt: r.bookedAt,
      })
    }
    return Array.from(grouped.values())
  })

// Re-export tx-level helper for booking transaction (consumed by Phase 3.5).
export async function attributeRentalInTx(
  tx: Awaited<typeof import('#/db')>['db'],
  input: {
    refCode: string
    rentalId: string
    paidAmountSen: number
    userId: string | null
    clickedAt: Date | null
  },
): Promise<{ attributionId: string | null }> {
  const affiliate = await findAffiliateByCode(tx, input.refCode)
  if (!affiliate || affiliate.status !== 'active') {
    return { attributionId: null }
  }
  const commissionSen = computeCommissionSen(
    affiliate.commissionType,
    affiliate.commissionValueSen,
    input.paidAmountSen,
  )
  const [inserted] = await tx
    .insert(affiliateAttributions)
    .values({
      affiliateId: affiliate.id,
      userId: input.userId,
      rentalId: input.rentalId,
      clickedAt: input.clickedAt,
      status: 'pending',
      commissionSen,
    })
    .returning({ id: affiliateAttributions.id })
  return { attributionId: inserted?.id ?? null }
}

void sum
