import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './auth'
import { rentals } from './fleet'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const affiliateTypeEnum = pgEnum('affiliate_type', [
  'individual',
  'company',
])

export const affiliateCommissionTypeEnum = pgEnum('affiliate_commission_type', [
  'percent',
  'fixed',
])

export const affiliateStatusEnum = pgEnum('affiliate_status', [
  'active',
  'paused',
  'archived',
])

export const affiliateAttributionStatusEnum = pgEnum(
  'affiliate_attribution_status',
  ['pending', 'earned', 'voided', 'paid'],
)

export type AffiliateType = (typeof affiliateTypeEnum.enumValues)[number]
export type AffiliateCommissionType =
  (typeof affiliateCommissionTypeEnum.enumValues)[number]
export type AffiliateStatus = (typeof affiliateStatusEnum.enumValues)[number]
export type AffiliateAttributionStatus =
  (typeof affiliateAttributionStatusEnum.enumValues)[number]

// ─── affiliates ───────────────────────────────────────────────────────────────

export const affiliates = pgTable(
  'affiliates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    type: affiliateTypeEnum('type').notNull(),
    email: text('email').notNull(),
    code: text('code').notNull(),
    commissionType: affiliateCommissionTypeEnum('commission_type').notNull(),
    /**
     * Sen for `fixed`; whole percent (0-100) for `percent`. Mirrors the same
     * convention used by promos.discount_value_sen.
     */
    commissionValueSen: integer('commission_value_sen').notNull(),
    status: affiliateStatusEnum('status').notNull().default('active'),
    payoutMethod: text('payout_method'),
    taxInfo: jsonb('tax_info').$type<Record<string, unknown> | null>(),
    createdByUserId: text('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('affiliates_code_unique').on(t.code),
    uniqueIndex('affiliates_email_unique').on(t.email),
    index('affiliates_status_idx').on(t.status),
  ],
)

export type Affiliate = typeof affiliates.$inferSelect

// ─── affiliate_clicks ─────────────────────────────────────────────────────────

export const affiliateClicks = pgTable(
  'affiliate_clicks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    affiliateId: uuid('affiliate_id')
      .notNull()
      .references(() => affiliates.id, { onDelete: 'cascade' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    referrer: text('referrer'),
    landingPath: text('landing_path'),
    clickedAt: timestamp('clicked_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('affiliate_clicks_affiliate_idx').on(t.affiliateId),
    index('affiliate_clicks_clicked_at_idx').on(t.clickedAt),
  ],
)

export type AffiliateClick = typeof affiliateClicks.$inferSelect

// ─── affiliate_payout_batches ─────────────────────────────────────────────────
//
// Note: this table is declared BEFORE affiliateAttributions because attributions
// reference it. Drizzle generates the FK in declaration order, and Postgres
// requires the referenced table to exist first.

export const affiliatePayoutBatches = pgTable(
  'affiliate_payout_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    affiliateId: uuid('affiliate_id')
      .notNull()
      .references(() => affiliates.id, { onDelete: 'restrict' }),
    amountSen: integer('amount_sen').notNull(),
    attributionCount: integer('attribution_count').notNull(),
    paidAt: timestamp('paid_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    paidByUserId: text('paid_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reference: text('reference'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('affiliate_payout_batches_affiliate_idx').on(t.affiliateId),
    index('affiliate_payout_batches_paid_at_idx').on(t.paidAt),
  ],
)

export type AffiliatePayoutBatch = typeof affiliatePayoutBatches.$inferSelect

// ─── affiliate_attributions ───────────────────────────────────────────────────

export const affiliateAttributions = pgTable(
  'affiliate_attributions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    affiliateId: uuid('affiliate_id')
      .notNull()
      .references(() => affiliates.id, { onDelete: 'restrict' }),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    rentalId: uuid('rental_id')
      .notNull()
      .references(() => rentals.id, { onDelete: 'cascade' })
      .unique(),
    clickedAt: timestamp('clicked_at', { mode: 'date', withTimezone: true }),
    bookedAt: timestamp('booked_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    status: affiliateAttributionStatusEnum('status')
      .notNull()
      .default('pending'),
    commissionSen: integer('commission_sen').notNull().default(0),
    payoutBatchId: uuid('payout_batch_id').references(
      () => affiliatePayoutBatches.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('affiliate_attributions_affiliate_idx').on(t.affiliateId),
    index('affiliate_attributions_status_idx').on(t.status),
    index('affiliate_attributions_user_idx').on(t.userId),
  ],
)

export type AffiliateAttribution = typeof affiliateAttributions.$inferSelect
