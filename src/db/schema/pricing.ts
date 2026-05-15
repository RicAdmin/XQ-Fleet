import { date, integer, numeric, pgEnum, pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const seasonTypeEnum = pgEnum('season_type', ['Low', 'Peak', 'Super Peak'])

export type SeasonType = (typeof seasonTypeEnum.enumValues)[number]

export const seasonCalendar = pgTable('season_calendar', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  fromDate: date('from_date', { mode: 'date' }).notNull(),
  toDate: date('to_date', { mode: 'date' }).notNull(),
  seasonType: seasonTypeEnum('season_type').notNull(),
})

export type SeasonRange = typeof seasonCalendar.$inferSelect

export const promos = pgTable(
  'promos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    discount: numeric('discount', { precision: 5, scale: 2 }).notNull(),
    usageLeft: integer('usage_left').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('promos_title_unique').on(table.title)],
)

export type Promo = typeof promos.$inferSelect
