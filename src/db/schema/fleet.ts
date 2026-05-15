import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './auth'

export const carCategoryEnum = pgEnum('car_category', [
  'economy',
  'mpv',
  'suv',
  'other',
])

export const carStatusEnum = pgEnum('car_status', [
  'available',
  'reserved',
  'payment-pending',
  'rented',
  'maintenance',
  'damaged',
  'retired',
])

export const carColorEnum = pgEnum('car_color', [
  'white',
  'black',
  'silver',
  'grey',
  'red',
  'blue',
  'dark-blue',
  'maroon',
  'gold',
  'beige',
  'green',
  'other',
])

export type CarStatus = (typeof carStatusEnum.enumValues)[number]
export type CarCategory = (typeof carCategoryEnum.enumValues)[number]
export type CarColor = (typeof carColorEnum.enumValues)[number]

export const rentalTypeEnum = pgEnum('rental_type', ['booking', 'walk-in'])
export const rentalStatusEnum = pgEnum('rental_status', [
  'pending',
  'active',
  'closed',
  'cancelled',
])
export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'partial',
  'paid',
])

export type RentalType = (typeof rentalTypeEnum.enumValues)[number]
export type RentalStatus = (typeof rentalStatusEnum.enumValues)[number]
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number]
export const paymentProviderEnum = pgEnum('payment_provider', ['manual', 'ipay88'])
export const paymentAttemptStatusEnum = pgEnum('payment_attempt_status', [
  'pending',
  'successful',
  'failed',
  'voided',
])

export const paymentModeEnum = pgEnum('payment_mode', ['full', 'deposit'])
export type PaymentMode = (typeof paymentModeEnum.enumValues)[number]

export const paymentSettings = pgTable('payment_settings', {
  id: integer('id').primaryKey().default(1),
  paymentMode: paymentModeEnum('payment_mode').notNull().default('full'),
  depositAmountSen: integer('deposit_amount_sen').notNull().default(0),
  sandboxMode: boolean('sandbox_mode').notNull().default(true),
  enabled: boolean('enabled').notNull().default(false),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})

export const maintenanceEventTypeEnum = pgEnum('maintenance_event_type', [
  'scheduled',
  'unscheduled',
  'damage',
  'road-tax',
  'insurance',
])

export const maintenanceEventStatusEnum = pgEnum('maintenance_event_status', [
  'open',
  'completed',
])

export type MaintenanceEventType = (typeof maintenanceEventTypeEnum.enumValues)[number]
export type MaintenanceEventStatus = (typeof maintenanceEventStatusEnum.enumValues)[number]

export const cars = pgTable(
  'cars',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    plateNumber: text('plate_number').notNull(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    color: carColorEnum('color').notNull().default('other'),
    category: carCategoryEnum('category').notNull().default('other'),
    status: carStatusEnum('status').notNull().default('available'),
    dailyRateSen: integer('daily_rate_sen').notNull().default(0),
    priceLowSeasonSen: integer('price_low_season_sen').notNull().default(0),
    pricePeakSeasonSen: integer('price_peak_season_sen').notNull().default(0),
    priceSuperPeakSeasonSen: integer('price_super_peak_season_sen').notNull().default(0),
    extHourLowSen: integer('ext_hour_low_sen').notNull().default(0),
    extHourPeakAndSuperPeakSen: integer('ext_hour_peak_and_super_peak_sen').notNull().default(0),
    deliveryFeeAirportSen: integer('delivery_fee_airport_sen').notNull().default(0),
    deliveryFeeHotelSen: integer('delivery_fee_hotel_sen').notNull().default(0),
    minRentalDays: integer('min_rental_days').notNull().default(1),
    maxRentalDays: integer('max_rental_days').notNull().default(30),
    availableForBooking: boolean('available_for_booking').notNull().default(true),
    currentMileage: integer('current_mileage'),
    notes: text('notes'),
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
    uniqueIndex('cars_plate_number_unique').on(table.plateNumber),
    index('cars_status_idx').on(table.status),
  ],
)

export const carPhotos = pgTable(
  'car_photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    carId: uuid('car_id')
      .notNull()
      .references(() => cars.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isCover: boolean('is_cover').notNull().default(false),
    createdAt: timestamp('created_at', {
      mode: 'date',
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('car_photos_car_id_idx').on(table.carId)],
)

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authUserId: text('auth_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    fullName: text('full_name'),
    email: text('email'),
    icOrPassport: text('ic_or_passport'),
    phone: text('phone'),
    address: text('address'),
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
    uniqueIndex('customers_auth_user_id_unique').on(table.authUserId),
    uniqueIndex('customers_ic_or_passport_unique').on(table.icOrPassport),
  ],
)

export const rentals = pgTable(
  'rentals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    carId: uuid('car_id')
      .notNull()
      .references(() => cars.id, { onDelete: 'restrict' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'restrict' }),
    type: rentalTypeEnum('type').notNull(),
    status: rentalStatusEnum('status').notNull().default('pending'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
    startDate: timestamp('start_date', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    endDate: timestamp('end_date', {
      mode: 'date',
      withTimezone: true,
    }).notNull(),
    actualReturnDate: timestamp('actual_return_date', {
      mode: 'date',
      withTimezone: true,
    }),
    dailyRateSen: integer('daily_rate_sen').notNull().default(0),
    totalAmountSen: integer('total_amount_sen').notNull().default(0),
    depositAmountSen: integer('deposit_amount_sen').notNull().default(0),
    paidAmountSen: integer('paid_amount_sen').notNull().default(0),
    pickUpTime: text('pick_up_time'),
    returnTime: text('return_time'),
    pickUpLocation: text('pick_up_location'),
    returnLocation: text('return_location'),
    childSeat: boolean('child_seat').notNull().default(false),
    secondDriver: boolean('second_driver').notNull().default(false),
    couponCode: text('coupon_code'),
    baseRentalSen: integer('base_rental_sen').notNull().default(0),
    extraHoursDecimal: numeric('extra_hours_decimal', { precision: 10, scale: 4 }).notNull().default('0'),
    extraChargeSen: integer('extra_charge_sen').notNull().default(0),
    extraRule: text('extra_rule').notNull().default('none'),
    addonsTotalSen: integer('addons_total_sen').notNull().default(0),
    deliveryFeeSen: integer('delivery_fee_sen').notNull().default(0),
    discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }).notNull().default('0'),
    discountAmountSen: integer('discount_amount_sen').notNull().default(0),
    subTotalSen: integer('sub_total_sen').notNull().default(0),
    startMileage: integer('start_mileage'),
    endMileage: integer('end_mileage'),
    startConditionNote: text('start_condition_note'),
    endConditionNote: text('end_condition_note'),
    paymentHoldExpiresAt: timestamp('payment_hold_expires_at', {
      mode: 'date',
      withTimezone: true,
    }),
    createdByUserId: text('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
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
    index('rentals_car_id_idx').on(table.carId),
    index('rentals_customer_id_idx').on(table.customerId),
    index('rentals_status_idx').on(table.status),
  ],
)

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    rentalId: uuid('rental_id')
      .notNull()
      .references(() => rentals.id, { onDelete: 'cascade' }),
    provider: paymentProviderEnum('provider').notNull().default('manual'),
    externalRef: text('external_ref'),
    amountSen: integer('amount_sen').notNull().default(0),
    currency: text('currency').notNull().default('MYR'),
    status: paymentAttemptStatusEnum('status').notNull().default('pending'),
    paymentMethod: text('payment_method'),
    rawResponse: jsonb('raw_response'),
    ipay88TransId: text('ipay88_trans_id'),
    ipay88AuthCode: text('ipay88_auth_code'),
    callbackSource: text('callback_source'),
    respondedAt: timestamp('responded_at', {
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
  (table) => [index('payments_rental_id_idx').on(table.rentalId)],
)

export const maintenanceEvents = pgTable(
  'maintenance_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    carId: uuid('car_id')
      .notNull()
      .references(() => cars.id, { onDelete: 'cascade' }),
    type: maintenanceEventTypeEnum('type').notNull(),
    description: text('description').notNull(),
    mileageAtService: integer('mileage_at_service'),
    costSen: integer('cost_sen').notNull().default(0),
    workshopVendor: text('workshop_vendor'),
    status: maintenanceEventStatusEnum('status').notNull().default('open'),
    openedAt: timestamp('opened_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { mode: 'date', withTimezone: true }),
    nextDueMileage: integer('next_due_mileage'),
    nextDueDate: timestamp('next_due_date', { mode: 'date', withTimezone: true }),
    createdByUserId: text('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('maintenance_events_car_id_idx').on(table.carId),
    index('maintenance_events_status_idx').on(table.status),
  ],
)

export const carServiceConfig = pgTable('car_service_config', {
  carId: uuid('car_id')
    .primaryKey()
    .references(() => cars.id, { onDelete: 'cascade' }),
  serviceIntervalKm: integer('service_interval_km'),
  serviceIntervalDays: integer('service_interval_days'),
  alertBeforeKm: integer('alert_before_km').notNull().default(500),
  alertBeforeDays: integer('alert_before_days').notNull().default(7),
  roadTaxExpiryDate: timestamp('road_tax_expiry_date', { mode: 'date', withTimezone: true }),
  roadTaxRenewalCostSen: integer('road_tax_renewal_cost_sen').notNull().default(0),
  roadTaxPolicyRef: text('road_tax_policy_ref'),
  insuranceExpiryDate: timestamp('insurance_expiry_date', { mode: 'date', withTimezone: true }),
  insuranceRenewalCostSen: integer('insurance_renewal_cost_sen').notNull().default(0),
  insurancePolicyRef: text('insurance_policy_ref'),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
})
