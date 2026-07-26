import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const pickupLocationKindEnum = pgEnum('pickup_location_kind', [
  'office',
  'airport',
  'jetty',
  'hotel',
  'custom',
])

export type PickupLocationKind = (typeof pickupLocationKindEnum.enumValues)[number]

export const pickupLocations = pgTable(
  'pickup_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull(),
    label: text('label').notNull(),
    kind: pickupLocationKindEnum('kind').notNull().default('custom'),
    deliveryFeeSen: integer('delivery_fee_sen').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('pickup_locations_code_idx').on(table.code),
    index('pickup_locations_active_idx').on(table.isActive),
  ],
)
