import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { userRoleEnum, users } from './auth'

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'deactivate',
  'bulk_generate',
  'booking.create',
  'booking.update',
  'booking.handover',
  'booking.close',
  'booking.extend',
  'booking.plate_change',
  'booking.cancel',
  'booking.refund_request',
  'booking.note',
  'payment.refund',
  'affiliate.payout',
])

export type AuditAction = (typeof auditActionEnum.enumValues)[number]

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    actorRole: userRoleEnum('actor_role'),
    action: auditActionEnum('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    before: jsonb('before'),
    after: jsonb('after'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_actor_idx').on(table.actorUserId),
    index('audit_log_created_at_idx').on(table.createdAt),
  ],
)

export type AuditLogRow = typeof auditLog.$inferSelect
