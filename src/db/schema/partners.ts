import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { carCategoryEnum, cars } from './fleet'

export const partnerStatusEnum = pgEnum('partner_status', [
  'active',
  'inactive',
])

export type PartnerStatus = (typeof partnerStatusEnum.enumValues)[number]

export const partners = pgTable(
  'partners',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    code: text('code').notNull(),
    contactPerson: text('contact_person'),
    phone: text('phone'),
    email: text('email'),
    status: partnerStatusEnum('status').notNull().default('active'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('partners_code_unique').on(t.code),
    index('partners_status_idx').on(t.status),
    index('partners_created_at_idx').on(t.createdAt),
  ],
)

export const partnerCarModels = pgTable(
  'partner_car_models',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    partnerId: uuid('partner_id')
      .notNull()
      .references(() => partners.id, { onDelete: 'cascade' }),
    make: text('make').notNull(),
    model: text('model').notNull(),
    category: carCategoryEnum('category').notNull().default('other'),
    yearFrom: integer('year_from'),
    yearTo: integer('year_to'),
    maxUnits: integer('max_units').notNull().default(1),
    wholesaleDailySen: integer('wholesale_daily_sen'),
    leadTimeHours: integer('lead_time_hours'),
    linkedCarId: uuid('linked_car_id').references(() => cars.id, {
      onDelete: 'set null',
    }),
    isActive: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('partner_car_models_partner_idx').on(t.partnerId),
    index('partner_car_models_linked_car_idx').on(t.linkedCarId),
    index('partner_car_models_active_idx').on(t.isActive),
  ],
)

export type Partner = typeof partners.$inferSelect
export type PartnerCarModel = typeof partnerCarModels.$inferSelect
