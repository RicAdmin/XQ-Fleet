import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

import { users } from './auth'
import { carCategoryEnum, customers, rentals } from './fleet'

export const seasonTypeEnum = pgEnum('season_type', ['Low', 'Peak', 'Super Peak'])

export type SeasonType = (typeof seasonTypeEnum.enumValues)[number]

export const seasonCalendar = pgTable('season_calendar', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  fromDate: date('from_date', { mode: 'date' }).notNull(),
  toDate: date('to_date', { mode: 'date' }).notNull(),
  seasonType: seasonTypeEnum('season_type').notNull(),
})

export type SeasonRange = typeof seasonCalendar.$inferSelect

// ─── Promos ───────────────────────────────────────────────────────────────────
//
// Legacy columns kept temporarily for backward-compat:
//   - `title` and `discount` are still present and writable.
//   - New code reads/writes `code`, `discountType`, `discountValueSen`,
//     `maxRedemptions`, `redemptionsUsed`, `perUserLimit`, etc.
// A follow-up migration will DROP `title` and `discount` once all read sites
// have been migrated.

export const promoDiscountTypeEnum = pgEnum('promo_discount_type', ['percent', 'fixed'])
export type PromoDiscountType = (typeof promoDiscountTypeEnum.enumValues)[number]

export const promos = pgTable(
  'promos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Legacy columns (kept; migration backfills `code = title`, `discount` mirror).
    title: text('title').notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).notNull(),
    usageLeft: integer('usage_left').notNull().default(0),
    // New columns
    code: text('code').notNull(),
    discountType: promoDiscountTypeEnum('discount_type').notNull().default('percent'),
    discountValueSen: integer('discount_value_sen').notNull().default(0),
    maxRedemptions: integer('max_redemptions'),
    redemptionsUsed: integer('redemptions_used').notNull().default(0),
    perUserLimit: integer('per_user_limit'),
    minBookingAmountSen: integer('min_booking_amount_sen').notNull().default(0),
    applicableCarCategories: carCategoryEnum('applicable_car_categories')
      .array()
      .notNull()
      .default(sql`ARRAY[]::car_category[]`),
    startsAt: timestamp('starts_at', { mode: 'date', withTimezone: true }),
    endsAt: timestamp('ends_at', { mode: 'date', withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    stackableWithAffiliate: boolean('stackable_with_affiliate').notNull().default(false),
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
  (table) => [
    uniqueIndex('promos_title_unique').on(table.title),
    uniqueIndex('promos_code_unique').on(table.code),
    index('promos_active_idx').on(table.isActive),
  ],
)

export type Promo = typeof promos.$inferSelect

export const promoRedemptions = pgTable(
  'promo_redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    promoId: uuid('promo_id')
      .notNull()
      .references(() => promos.id, { onDelete: 'restrict' }),
    rentalId: uuid('rental_id')
      .notNull()
      .references(() => rentals.id, { onDelete: 'cascade' })
      .unique(),
    customerId: uuid('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerEmail: text('customer_email'),
    amountDiscountedSen: integer('amount_discounted_sen').notNull(),
    redeemedAt: timestamp('redeemed_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('promo_redemptions_promo_idx').on(table.promoId),
    index('promo_redemptions_user_idx').on(table.userId),
    index('promo_redemptions_email_idx').on(table.customerEmail),
  ],
)

export type PromoRedemption = typeof promoRedemptions.$inferSelect
