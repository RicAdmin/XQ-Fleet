import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './auth'
import { rentals } from './fleet'

export const refundStatusEnum = pgEnum('refund_status', [
  'requested',
  'approved',
  'rejected',
  'paid',
])

export type RefundStatus = (typeof refundStatusEnum.enumValues)[number]

export const refunds = pgTable(
  'refunds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rentalId: uuid('rental_id')
      .notNull()
      .references(() => rentals.id, { onDelete: 'cascade' }),
    status: refundStatusEnum('status').notNull().default('requested'),
    amountSen: integer('amount_sen').notNull(),
    reason: text('reason'),
    notes: text('notes'),
    requestedByUserId: text('requested_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    processedByUserId: text('processed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    externalRef: text('external_ref'),
    requestedAt: timestamp('requested_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    processedAt: timestamp('processed_at', {
      mode: 'date',
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('refunds_rental_idx').on(table.rentalId),
    index('refunds_status_idx').on(table.status),
  ],
)

export type Refund = typeof refunds.$inferSelect
