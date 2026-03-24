import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './auth'

export const invitationRoleEnum = pgEnum('invitation_role', ['staff'])

export const staffInvitations = pgTable(
  'staff_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull(),
    role: invitationRoleEnum('role').notNull().default('staff'),
    tokenHash: text('token_hash').notNull(),
    invitedByUserId: text('invited_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    expiresAt: timestamp('expires_at', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    acceptedAt: timestamp('accepted_at', {
      mode: 'date',
      withTimezone: true,
    }),
    revokedAt: timestamp('revoked_at', {
      mode: 'date',
      withTimezone: true,
    }),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('staff_invitations_token_hash_unique').on(table.tokenHash),
    index('staff_invitations_email_idx').on(table.email),
  ],
)
