import { createServerFn } from '@tanstack/react-start'
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lt,
  lte,
  not,
  or,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'

import { carPhotos, cars, customers, payments, rentalPhotos, rentals, users } from '#/db/schema'
import type {
  PaymentStatus,
  RentalFulfillmentSource,
  RentalStatus,
  RentalType,
} from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles, fullAdminRoles, type AppRole } from '#/lib/auth-model'
import type { AuditAction } from '#/db/schema/audit'
import {
  assertCarHasBookingCapacity,
  getCarFleetCapacity,
  usesSingleUnitCarStatus,
} from '#/lib/fleet-capacity'
import {
  fulfillmentForKnownPlate,
  makeTempHoldLabel,
  resolveFulfillmentForListingCar,
} from '#/lib/rental-fulfillment'
import type { JobSource } from '#/lib/job-display'
import {
  adminInputValidator,
  carCategoryFilterSchema,
  paginationSchema,
  sortDirSchema,
  uuidString,
} from '#/lib/validation/admin-schemas'

const assignedCars = alias(cars, 'assigned_cars')
const handoverUsers = alias(users, 'handover_users')
const returnUsers = alias(users, 'return_users')

/** CS-created (Booked) jobs must be confirmed within 72 hours of creation. */
export const BOOKING_WINDOW_MS = 72 * 60 * 60 * 1000

/**
 * Fixed refundable deposit by model (sen):
 *   sedan / MPV → RM200 · Staria & Jimny → RM300 · Mini Cooper → RM500
 */
export function fixedDepositSenForModel(model: string | null | undefined): number {
  const m = (model ?? '').toLowerCase()
  if (m.includes('mini')) return 50000
  if (m.includes('staria') || m.includes('jimny')) return 30000
  return 20000
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type RentalListRow = {
  id: string
  carId: string
  customerId: string
  type: RentalType
  status: RentalStatus
  paymentStatus: PaymentStatus
  startDate: Date
  endDate: Date
  pickUpTime: string | null
  returnTime: string | null
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  paidAmountSen: number
  extraHoursDecimal: string | null
  createdAt: Date
  updatedAt: Date
  actualPickupAt: Date | null
  actualReturnAt: Date | null
  customerFullName: string | null
  customerEmail: string | null
  customerPhone: string | null
  customerIcOrPassport: string | null
  pickUpLocation: string | null
  returnLocation: string | null
  carPlateNumber: string | null
  listingPlateNumber: string | null
  assignedCarId: string | null
  fulfillmentSource: RentalFulfillmentSource
  tempPlateLabel: string | null
  carMake: string | null
  carModel: string | null
  createdByUserId: string | null
  createdByName: string | null
  handoverByUserId: string | null
  returnByUserId: string | null
  handoverByName: string | null
  returnByName: string | null
  affiliateRefCode: string | null
  affiliateAttributionId: string | null
  refferqRefCode: string | null
}

export type RentalFullRow = RentalListRow & {
  actualReturnDate: Date | null
  startMileage: number | null
  endMileage: number | null
  startConditionNote: string | null
  endConditionNote: string | null
  carCategory: string | null
  carDailyRateSen: number | null
  carCoverPhotoUrl: string | null
  carCoverPhotoAlt: string | null
  baseRentalSen: number
  extraChargeSen: number
  addonsTotalSen: number
  deliveryFeeSen: number
  discountPercent: string
  discountAmountSen: number
  subTotalSen: number
}

export type AvailableCarOption = {
  id: string
  plateNumber: string
  make: string
  model: string
  category: string
  dailyRateSen: number
}

// ─── Input types ──────────────────────────────────────────────────────────────

type CreateRentalInput = {
  carId: string
  customerId: string
  type: RentalType
  startDate: string // ISO date string YYYY-MM-DD
  endDate: string
  pickUpTime?: string
  returnTime?: string
  pickUpLocation?: string
  returnLocation?: string
  deliveryFeeSen?: number
  dailyRateSen: number
  totalAmountSen: number
  depositAmountSen: number
  /** Round trip or one-way (different return meet point). Default 'round'. */
  tripType?: 'round' | 'oneway'
  /** When true (CS plate picker), treat carId as the owned plate. Default true. */
  assignKnownPlate?: boolean
}

type ConfirmHandoverInput = {
  rentalId: string
  startMileage?: number
  startConditionNote?: string
  /** Concrete owned plate confirmed at pickup (optional). */
  assignedCarId?: string
  /** Payment collected from the customer at pickup (optional). */
  paymentAmountSen?: number
  paymentMethod?: string
  /** Deposit cash collected at pickup, refundable at return (optional). */
  depositPaidSen?: number
}

type CloseReturnInput = {
  rentalId: string
  endMileage: number
  endConditionNote?: string
  paidAmountSen: number
  paymentMethod: string
  flagDamage?: boolean
  /** Extra charge when fuel is returned lower than at pickup (sen). */
  fuelFeeSen?: number
}

type CancelRentalInput = {
  rentalId: string
}

type ExtendRentalInput = {
  rentalId: string
  newEndDate: string // ISO date string
}

type UpdateRentalBookingInput = {
  rentalId: string
  type: RentalType
  startDate: string
  endDate: string
  pickUpTime: string
  returnTime: string
  pickUpLocation: string
  returnLocation: string
}

type DeleteRentalInput = {
  rentalId: string
}

type GetRentalByIdInput = {
  rentalId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function derivePaymentStatus(paidSen: number, totalSen: number): PaymentStatus {
  if (paidSen <= 0) return 'unpaid'
  if (paidSen >= totalSen) return 'paid'
  return 'partial'
}

function calcTotalSen(dailyRateSen: number, startDate: Date, endDate: Date): number {
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  )
  return dailyRateSen * days
}

// ─── Server functions ─────────────────────────────────────────────────────────

export const getRentals = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(fleetOpsRoles)
  const { db } = await import('#/db')
  return db
    .select({
      id: rentals.id,
      carId: rentals.carId,
      customerId: rentals.customerId,
      type: rentals.type,
      status: rentals.status,
      paymentStatus: rentals.paymentStatus,
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      dailyRateSen: rentals.dailyRateSen,
      totalAmountSen: rentals.totalAmountSen,
      depositAmountSen: rentals.depositAmountSen,
      paidAmountSen: rentals.paidAmountSen,
      createdAt: rentals.createdAt,
      updatedAt: rentals.updatedAt,
      customerFullName: customers.fullName,
      carPlateNumber: cars.plateNumber,
      carMake: cars.make,
      carModel: cars.model,
    })
    .from(rentals)
    .leftJoin(cars, eq(rentals.carId, cars.id))
    .leftJoin(customers, eq(rentals.customerId, customers.id))
    .orderBy(desc(rentals.startDate))
})

/** Best-effort audit entry for staff job actions — never blocks the mutation. */
async function auditRentalAction(
  session: { user: { id: string; role?: string | null } },
  action: AuditAction,
  rentalId: string,
  detail: { before?: unknown; after?: unknown },
) {
  try {
    const { recordAuditLog } = await import('#/lib/audit-log')
    await recordAuditLog({
      actorUserId: session.user.id,
      actorRole: session.user.role as AppRole,
      action,
      entityType: 'rental',
      entityId: rentalId,
      before: detail.before,
      after: detail.after,
    })
  } catch (err) {
    console.error(`[audit] failed to record ${action} for rental ${rentalId}`, err)
  }
}

const rentalStatusValues = [
  'pending',
  'confirmed',
  'expired',
  'active',
  'closed',
  'cancelled',
] as const satisfies readonly RentalStatus[]

export type RentalListResult = {
  rows: RentalListRow[]
  total: number
  page: number
  pageSize: number
  statusCounts?: Record<string, number>
}

export type OperationsQueue = {
  pickups: RentalListRow[]
  returns: RentalListRow[]
  all: RentalListRow[]
}

const rentalListSelect = {
  id: rentals.id,
  carId: rentals.carId,
  customerId: rentals.customerId,
  type: rentals.type,
  status: rentals.status,
  paymentStatus: rentals.paymentStatus,
  startDate: rentals.startDate,
  endDate: rentals.endDate,
  pickUpTime: rentals.pickUpTime,
  returnTime: rentals.returnTime,
  dailyRateSen: rentals.dailyRateSen,
  totalAmountSen: rentals.totalAmountSen,
  depositAmountSen: rentals.depositAmountSen,
  paidAmountSen: rentals.paidAmountSen,
  extraHoursDecimal: rentals.extraHoursDecimal,
  createdAt: rentals.createdAt,
  updatedAt: rentals.updatedAt,
  actualPickupAt: rentals.actualPickupAt,
  actualReturnAt: rentals.actualReturnDate,
  customerFullName: customers.fullName,
  customerEmail: customers.email,
  customerPhone: customers.phone,
  customerIcOrPassport: customers.icOrPassport,
  pickUpLocation: rentals.pickUpLocation,
  returnLocation: rentals.returnLocation,
  carPlateNumber: sql<string>`coalesce(${assignedCars.plateNumber}, ${rentals.tempPlateLabel}, ${cars.plateNumber})`,
  listingPlateNumber: cars.plateNumber,
  assignedCarId: rentals.assignedCarId,
  fulfillmentSource: rentals.fulfillmentSource,
  tempPlateLabel: rentals.tempPlateLabel,
  carMake: cars.make,
  carModel: cars.model,
  createdByUserId: rentals.createdByUserId,
  handoverByUserId: rentals.handoverByUserId,
  returnByUserId: rentals.returnByUserId,
  createdByName: users.name,
  handoverByName: handoverUsers.name,
  returnByName: returnUsers.name,
  affiliateRefCode: rentals.affiliateRefCode,
  affiliateAttributionId: rentals.affiliateAttributionId,
  refferqRefCode: rentals.refferqRefCode,
} as const

function rentalHasSalesAgentAttribution() {
  return or(
    isNotNull(rentals.affiliateAttributionId),
    and(
      isNotNull(rentals.affiliateRefCode),
      sql`trim(${rentals.affiliateRefCode}) <> ''`,
    ),
    and(
      isNotNull(rentals.refferqRefCode),
      sql`trim(${rentals.refferqRefCode}) <> ''`,
    ),
  )!
}

function jobSourceFilter(source: JobSource) {
  if (source === 'in-house') return eq(rentals.type, 'walk-in')
  if (source === 'sales-agent') {
    return and(eq(rentals.type, 'booking'), rentalHasSalesAgentAttribution())!
  }
  return and(eq(rentals.type, 'booking'), not(rentalHasSalesAgentAttribution()))!
}

export const getOperationsQueue = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OperationsQueue> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    await expireStaleBookings(db)

    const rows = await db
      .select(rentalListSelect)
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(assignedCars, eq(rentals.assignedCarId, assignedCars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))
      .leftJoin(handoverUsers, eq(rentals.handoverByUserId, handoverUsers.id))
      .leftJoin(returnUsers, eq(rentals.returnByUserId, returnUsers.id))
      .where(inArray(rentals.status, ['confirmed', 'active']))
      .orderBy(asc(rentals.startDate), asc(rentals.endDate))

    const pickups = rows
      .filter((row) => row.status === 'confirmed')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    const returns = rows
      .filter((row) => row.status === 'active')
      .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())

    return { pickups, returns, all: rows }
  },
)

const listRentalsSchema = paginationSchema.extend({
  status: z.enum(rentalStatusValues).optional(),
  paymentStatus: z.enum(['unpaid', 'partial', 'paid']).optional(),
  source: z.enum(['in-house', 'web', 'sales-agent']).optional(),
  /** Active rentals whose return datetime has already passed. */
  overdue: z.boolean().optional(),
  category: carCategoryFilterSchema,
  search: z.string().trim().max(120).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  includeStatusCounts: z.boolean().optional(),
  sortKey: z
    .enum([
      'startDate',
      'endDate',
      'totalAmountSen',
      'status',
      'carPlateNumber',
      'customerFullName',
      'createdAt',
    ])
    .default('startDate'),
  sortDir: sortDirSchema,
})

async function queryRentalStatusCounts() {
  const { db } = await import('#/db')
  const rows = await db
    .select({ status: rentals.status, count: sql<number>`count(*)::int` })
    .from(rentals)
    .groupBy(rentals.status)

  const statusCounts: Record<string, number> = { all: 0 }
  for (const row of rows) {
    const n = Number(row.count)
    statusCounts[row.status] = n
    statusCounts.all += n
  }
  return statusCounts
}

export const getRentalStatusCounts = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireRole(fleetOpsRoles)
    return queryRentalStatusCounts()
  },
)

export const listRentals = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(listRentalsSchema))
  .handler(async ({ data }): Promise<RentalListResult> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    await expireStaleBookings(db)

    const filters = []
    if (data.status) filters.push(eq(rentals.status, data.status))
    if (data.paymentStatus) filters.push(eq(rentals.paymentStatus, data.paymentStatus))
    if (data.source) filters.push(jobSourceFilter(data.source))
    if (data.overdue) {
      filters.push(and(eq(rentals.status, 'active'), lt(rentals.endDate, new Date()))!)
    }
    if (data.category) filters.push(eq(cars.category, data.category))
    if (data.from) {
      filters.push(gte(rentals.startDate, new Date(`${data.from}T00:00:00`)))
    }
    if (data.to) {
      filters.push(lte(rentals.startDate, new Date(`${data.to}T23:59:59.999`)))
    }
    if (data.search) {
      const needle = `%${data.search}%`
      filters.push(
        or(
          ilike(customers.fullName, needle),
          ilike(customers.phone, needle),
          ilike(customers.email, needle),
          ilike(cars.plateNumber, needle),
          ilike(assignedCars.plateNumber, needle),
          ilike(rentals.tempPlateLabel, needle),
        )!,
      )
    }
    const whereClause = filters.length ? and(...filters) : undefined

    const sortColumn = {
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      totalAmountSen: rentals.totalAmountSen,
      status: rentals.status,
      carPlateNumber: sql`coalesce(${assignedCars.plateNumber}, ${rentals.tempPlateLabel}, ${cars.plateNumber})`,
      customerFullName: customers.fullName,
      createdAt: rentals.createdAt,
    }[data.sortKey]

    const orderBy = data.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
    const offset = (data.page - 1) * data.pageSize

    const baseQuery = db
      .select(rentalListSelect)
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(assignedCars, eq(rentals.assignedCarId, assignedCars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))
      .leftJoin(handoverUsers, eq(rentals.handoverByUserId, handoverUsers.id))
      .leftJoin(returnUsers, eq(rentals.returnByUserId, returnUsers.id))

    const rowsPromise = whereClause
      ? baseQuery.where(whereClause).orderBy(orderBy).limit(data.pageSize).offset(offset)
      : baseQuery.orderBy(orderBy).limit(data.pageSize).offset(offset)

    const countBase = db
      .select({ count: sql<number>`count(*)::int` })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(assignedCars, eq(rentals.assignedCarId, assignedCars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))
      .leftJoin(handoverUsers, eq(rentals.handoverByUserId, handoverUsers.id))
      .leftJoin(returnUsers, eq(rentals.returnByUserId, returnUsers.id))

    const countPromise = whereClause ? countBase.where(whereClause) : countBase

    const [rows, countResult, statusCounts] = await Promise.all([
      rowsPromise,
      countPromise,
      data.includeStatusCounts ? queryRentalStatusCounts() : Promise.resolve(undefined),
    ])

    return {
      rows,
      total: Number(countResult[0]?.count ?? 0),
      page: data.page,
      pageSize: data.pageSize,
      ...(statusCounts ? { statusCounts } : {}),
    }
  })

export const getRentalsByCarId = createServerFn({ method: 'GET' })
  .inputValidator((data: { carId: string }) => data)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    return db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        customerId: rentals.customerId,
        type: rentals.type,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        customerFullName: customers.fullName,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(eq(rentals.carId, data.carId))
      .orderBy(desc(rentals.startDate))
  })

/** Lightweight open jobs for status badges — avoids loading full rental history. */
export const getOpenRentalsByCarId = createServerFn({ method: 'GET' })
  .inputValidator((data: { carId: string }) => data)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    return db
      .select({
        id: rentals.id,
        status: rentals.status,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
      })
      .from(rentals)
      .where(
        and(
          eq(rentals.carId, data.carId),
          inArray(rentals.status, ['pending', 'active']),
        ),
      )
      .orderBy(desc(rentals.startDate))
      .limit(5)
  })

export const getRentalById = createServerFn({ method: 'GET' })
  .inputValidator((input: GetRentalByIdInput) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const rows = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        customerId: rentals.customerId,
        type: rentals.type,
        status: rentals.status,
        paymentStatus: rentals.paymentStatus,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        pickUpTime: rentals.pickUpTime,
        returnTime: rentals.returnTime,
        pickUpLocation: rentals.pickUpLocation,
        returnLocation: rentals.returnLocation,
        actualReturnDate: rentals.actualReturnDate,
        dailyRateSen: rentals.dailyRateSen,
        totalAmountSen: rentals.totalAmountSen,
        depositAmountSen: rentals.depositAmountSen,
        paidAmountSen: rentals.paidAmountSen,
        extraHoursDecimal: rentals.extraHoursDecimal,
        baseRentalSen: rentals.baseRentalSen,
        extraChargeSen: rentals.extraChargeSen,
        addonsTotalSen: rentals.addonsTotalSen,
        deliveryFeeSen: rentals.deliveryFeeSen,
        discountPercent: rentals.discountPercent,
        discountAmountSen: rentals.discountAmountSen,
        subTotalSen: rentals.subTotalSen,
        startMileage: rentals.startMileage,
        endMileage: rentals.endMileage,
        startConditionNote: rentals.startConditionNote,
        endConditionNote: rentals.endConditionNote,
        tripType: rentals.tripType,
        bookingExpiresAt: rentals.bookingExpiresAt,
        confirmedAt: rentals.confirmedAt,
        actualPickupAt: rentals.actualPickupAt,
        depositPaidSen: rentals.depositPaidSen,
        fuelFeeSen: rentals.fuelFeeSen,
        createdByUserId: rentals.createdByUserId,
        createdByName: users.name,
        handoverByName: handoverUsers.name,
        returnByName: returnUsers.name,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        customerFullName: customers.fullName,
        customerEmail: customers.email,
        customerIcOrPassport: customers.icOrPassport,
        customerPhone: customers.phone,
        carPlateNumber: sql<string>`coalesce(${assignedCars.plateNumber}, ${rentals.tempPlateLabel}, ${cars.plateNumber})`,
        listingPlateNumber: cars.plateNumber,
        assignedCarId: rentals.assignedCarId,
        fulfillmentSource: rentals.fulfillmentSource,
        tempPlateLabel: rentals.tempPlateLabel,
        carMake: cars.make,
        carModel: cars.model,
        carCategory: cars.category,
        carDailyRateSen: cars.dailyRateSen,
        carCoverPhotoUrl: carPhotos.url,
        carCoverPhotoAlt: carPhotos.altText,
        affiliateRefCode: rentals.affiliateRefCode,
        affiliateAttributionId: rentals.affiliateAttributionId,
        refferqRefCode: rentals.refferqRefCode,
      })
      .from(rentals)
      .leftJoin(cars, eq(rentals.carId, cars.id))
      .leftJoin(assignedCars, eq(rentals.assignedCarId, assignedCars.id))
      .leftJoin(
        carPhotos,
        and(eq(carPhotos.carId, cars.id), eq(carPhotos.isCover, true)),
      )
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(users, eq(rentals.createdByUserId, users.id))
      .leftJoin(handoverUsers, eq(rentals.handoverByUserId, handoverUsers.id))
      .leftJoin(returnUsers, eq(rentals.returnByUserId, returnUsers.id))
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    return rows[0] ?? null
  })

export type RentalAuditEntry = {
  id: string
  action: AuditAction
  actorName: string | null
  actorRole: string | null
  before: object | null
  after: object | null
  createdAt: Date
}

/** Audit timeline for one job — who did what, when, with before/after snapshots. */
export const getRentalAuditLog = createServerFn({ method: 'GET' })
  .inputValidator(adminInputValidator(z.object({ rentalId: uuidString })))
  .handler(async ({ data }): Promise<RentalAuditEntry[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const { auditLog } = await import('#/db/schema/audit')

    const rows = await db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        actorName: users.name,
        actorRole: auditLog.actorRole,
        before: auditLog.before,
        after: auditLog.after,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .leftJoin(users, eq(auditLog.actorUserId, users.id))
      .where(and(eq(auditLog.entityType, 'rental'), eq(auditLog.entityId, data.rentalId)))
      .orderBy(desc(auditLog.createdAt))
      .limit(50)

    return rows as RentalAuditEntry[]
  })

export const getAvailableCars = createServerFn({ method: 'GET' }).handler(async () => {
  await requireRole(fleetOpsRoles)
  const { db } = await import('#/db')
  return db
    .select({
      id: cars.id,
      plateNumber: cars.plateNumber,
      make: cars.make,
      model: cars.model,
      category: cars.category,
      dailyRateSen: cars.dailyRateSen,
    })
    .from(cars)
    .where(eq(cars.status, 'available'))
    .orderBy(cars.plateNumber)
})

/** Fleet-owned sibling plates for assigning fulfillment on a job. */
export const listOwnedPlatesForAssignment = createServerFn({ method: 'GET' })
  .inputValidator((input: { listingCarId: string }) => input)
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const [car] = await db
      .select({ id: cars.id, make: cars.make, model: cars.model })
      .from(cars)
      .where(eq(cars.id, data.listingCarId))
      .limit(1)
    if (!car) return []

    const { listOwnedSiblingUnits } = await import('#/lib/car-capacity')
    return listOwnedSiblingUnits(db, {
      carId: car.id,
      make: car.make,
      model: car.model,
    })
  })

export const createRental = createServerFn({ method: 'POST' })
  .inputValidator((input: CreateRentalInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      throw new Error('Invalid dates provided.')
    if (endDate <= startDate) throw new Error('End date must be after start date.')

    const pickUpLocation = data.pickUpLocation?.trim()
    const returnLocation = data.returnLocation?.trim()
    if (!pickUpLocation) throw new Error('Pickup location is required.')
    if (!returnLocation) throw new Error('Return location is required.')

    const { db } = await import('#/db')

    const fleetCapacity = await assertCarHasBookingCapacity(db, {
      carId: data.carId,
      tripStart: startDate,
      tripEnd: endDate,
      errorMessage: 'This car already has a booking that overlaps with the selected dates.',
    })

    // Get user ID for audit trail
    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    const createdByUserId = session?.user?.id ?? null

    const rentalId = crypto.randomUUID()
    const [carRow] = await db
      .select({
        id: cars.id,
        ownedByFleet: cars.ownedByFleet,
        make: cars.make,
        model: cars.model,
      })
      .from(cars)
      .where(eq(cars.id, data.carId))
      .limit(1)
    if (!carRow) throw new Error('Vehicle not found.')

    // CS plate pick → owned assignment. Listing-only pick → auto owned/temp.
    const fulfillment =
      data.assignKnownPlate === false
        ? await resolveFulfillmentForListingCar(db, {
            listingCarId: data.carId,
            tripStart: startDate,
            tripEnd: endDate,
            rentalIdForTempLabel: rentalId,
          })
        : fulfillmentForKnownPlate(data.carId)

    // Single-slot models keep legacy reserved status on the car row.
    if (usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'reserved', updatedAt: new Date() })
        .where(eq(cars.id, data.carId))
    }

    const result = await db
      .insert(rentals)
      .values({
        id: rentalId,
        carId: data.carId,
        assignedCarId: fulfillment.assignedCarId,
        fulfillmentSource: fulfillment.fulfillmentSource,
        partnerId: fulfillment.partnerId,
        partnerCarModelId: fulfillment.partnerCarModelId,
        tempPlateLabel: fulfillment.tempPlateLabel,
        plateConfirmedAt: fulfillment.plateConfirmedAt,
        customerId: data.customerId,
        type: data.type,
        status: 'pending',
        paymentStatus: 'unpaid',
        tripType:
          data.tripType ?? (pickUpLocation !== returnLocation ? 'oneway' : 'round'),
        bookingExpiresAt: new Date(Date.now() + BOOKING_WINDOW_MS),
        startDate,
        endDate,
        pickUpTime: data.pickUpTime?.trim() || '09:00:00',
        returnTime: data.returnTime?.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        deliveryFeeSen: data.deliveryFeeSen ?? 0,
        dailyRateSen: data.dailyRateSen,
        totalAmountSen: data.totalAmountSen,
        depositAmountSen: fixedDepositSenForModel(carRow.model),
        paidAmountSen: 0,
        createdByUserId,
      })
      .returning()

    await auditRentalAction(roleSession, 'booking.create', rentalId, {
      after: {
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        totalAmountSen: data.totalAmountSen,
        fulfillmentSource: fulfillment.fulfillmentSource,
      },
    })

    return result[0]
  })

/**
 * Lazy sweeper: CS-created (Booked) jobs past their 72h window become Expired.
 * Runs on every read of ops queue / job lists / CS dashboard so expiry is
 * always current without a cron. Legacy rows without a window are backfilled
 * from createdAt (then expired if already stale). Web payment-hold bookings
 * keep their own hold-expiry path and are untouched here.
 */
export async function expireStaleBookings(
  db: Awaited<typeof import('#/db')>['db'],
) {
  const now = new Date()

  await db.execute(sql`
    UPDATE rentals
    SET booking_expires_at = created_at + interval '72 hours'
    WHERE status = 'pending'
      AND booking_expires_at IS NULL
      AND payment_hold_expires_at IS NULL
  `)

  const stale = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(
      and(
        eq(rentals.status, 'pending'),
        isNotNull(rentals.bookingExpiresAt),
        lt(rentals.bookingExpiresAt, now),
      ),
    )
  if (stale.length === 0) return

  await db
    .update(rentals)
    .set({ status: 'expired', updatedAt: now })
    .where(
      inArray(
        rentals.id,
        stale.map((r) => r.id),
      ),
    )

  const { recordAuditLog } = await import('#/lib/audit-log')
  for (const row of stale) {
    await recordAuditLog({
      actorUserId: null,
      action: 'booking.update',
      entityType: 'rental',
      entityId: row.id,
      before: { status: 'pending' },
      after: { status: 'expired', reason: 'booking_window_elapsed' },
    })
  }
}

export const confirmRentalBooking = createServerFn({ method: 'POST' })
  .inputValidator((input: { rentalId: string }) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const [rental] = await db
      .select({
        id: rentals.id,
        status: rentals.status,
        bookingExpiresAt: rentals.bookingExpiresAt,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    if (!rental) throw new Error('Rental not found.')
    if (rental.status === 'expired')
      throw new Error('This job has expired. Renew it with payment info instead.')
    if (rental.status !== 'pending')
      throw new Error('Only booked (pending) jobs can be confirmed.')
    if (rental.bookingExpiresAt && rental.bookingExpiresAt < new Date())
      throw new Error('The 72-hour confirmation window has elapsed.')

    const now = new Date()
    await db
      .update(rentals)
      .set({
        status: 'confirmed',
        confirmedAt: now,
        confirmedByUserId: roleSession.user.id,
        updatedAt: now,
      })
      .where(eq(rentals.id, data.rentalId))

    await auditRentalAction(roleSession, 'booking.update', data.rentalId, {
      before: { status: 'pending' },
      after: { status: 'confirmed' },
    })

    return { id: data.rentalId, status: 'confirmed' as const }
  })

export const renewExpiredRental = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      rentalId: string
      paymentAmountSen: number
      paymentMethod?: string
      paymentNote?: string
    }) => input,
  )
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    if (!(data.paymentAmountSen > 0))
      throw new Error('Enter the payment amount to renew this job.')

    const { db } = await import('#/db')
    const [rental] = await db
      .select({
        id: rentals.id,
        status: rentals.status,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'expired')
      throw new Error('Only expired jobs can be renewed.')

    const now = new Date()
    const newPaid = (rental.paidAmountSen ?? 0) + data.paymentAmountSen
    const paymentStatus = derivePaymentStatus(rental.totalAmountSen, newPaid)

    await db
      .update(rentals)
      .set({
        status: 'confirmed',
        confirmedAt: now,
        confirmedByUserId: roleSession.user.id,
        paidAmountSen: newPaid,
        paymentStatus,
        updatedAt: now,
      })
      .where(eq(rentals.id, data.rentalId))

    const method =
      data.paymentMethod === 'bank-transfer' || data.paymentMethod === 'online'
        ? data.paymentMethod
        : 'cash'
    await db.insert(payments).values({
      rentalId: data.rentalId,
      provider: 'manual',
      amountSen: data.paymentAmountSen,
      status: 'successful',
      paymentMethod: method,
      rawResponse: data.paymentNote?.trim()
        ? { note: data.paymentNote.trim() }
        : { note: 'Renewal payment' },
      respondedAt: now,
    })

    await auditRentalAction(roleSession, 'booking.update', data.rentalId, {
      before: { status: 'expired' },
      after: { status: 'confirmed', paymentAmountSen: data.paymentAmountSen },
    })

    return { id: data.rentalId, status: 'confirmed' as const, paymentStatus }
  })

// ─── Rental photos (pickup / return inspection) ─────────────────────────────

export type RentalPhotoRow = {
  id: string
  rentalId: string
  phase: 'pickup' | 'return'
  category: string
  url: string
  caption: string | null
  uploadedByUserId: string | null
  createdAt: Date
}

export const listRentalPhotos = createServerFn({ method: 'GET' })
  .inputValidator((input: { rentalId: string }) => input)
  .handler(async ({ data }): Promise<RentalPhotoRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const rows = await db
      .select()
      .from(rentalPhotos)
      .where(eq(rentalPhotos.rentalId, data.rentalId))
      .orderBy(desc(rentalPhotos.createdAt))
    return rows as RentalPhotoRow[]
  })

export const generateRentalPhotoUploadUrl = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: { rentalId: string; phase: 'pickup' | 'return'; fileName: string; contentType: string }) => input,
  )
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const [rental] = await db
      .select({ id: rentals.id })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    if (!rental) throw new Error('Rental not found.')

    const { getPresignedPutUrl, getPublicUrl } = await import(
      '#/integrations/cloudflare-r2'
    )
    const key = `rentals/${data.rentalId}/${data.phase}/${Date.now()}-${data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const presignedUrl = await getPresignedPutUrl(key, data.contentType)
    return { presignedUrl, publicUrl: getPublicUrl(key) }
  })

export const saveRentalPhoto = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      rentalId: string
      phase: 'pickup' | 'return'
      category?: string
      url: string
      caption?: string
    }) => input,
  )
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const [row] = await db
      .insert(rentalPhotos)
      .values({
        rentalId: data.rentalId,
        phase: data.phase,
        category: data.category?.trim() || 'other',
        url: data.url,
        caption: data.caption?.trim() || null,
        uploadedByUserId: roleSession.user.id,
      })
      .returning()

    await auditRentalAction(roleSession, 'booking.update', data.rentalId, {
      after: { photoAdded: { phase: data.phase, url: data.url } },
    })

    return row
  })

// ─── Rental photos end ───────────────────────────────────────────────────────

export const confirmHandover = createServerFn({ method: 'POST' })
  .inputValidator((input: ConfirmHandoverInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        totalAmountSen: rentals.totalAmountSen,
        paidAmountSen: rentals.paidAmountSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'confirmed')
      throw new Error('Only confirmed rentals can be handed over.')

    // Optional plate confirmation — ops hands over a concrete owned unit.
    if (data.assignedCarId) {
      const [plate] = await db
        .select({ id: cars.id, ownedByFleet: cars.ownedByFleet, status: cars.status })
        .from(cars)
        .where(eq(cars.id, data.assignedCarId))
        .limit(1)
      if (!plate || !plate.ownedByFleet) throw new Error('Assigned vehicle must be fleet-owned.')
      if (plate.status === 'retired') throw new Error('Cannot assign a retired vehicle.')
    }

    const paymentSen = Math.max(0, Math.round(data.paymentAmountSen ?? 0))
    const newPaidSen = rental.paidAmountSen + paymentSen
    const now = new Date()

    const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'rented', updatedAt: now })
        .where(eq(cars.id, rental.carId))
    }

    const result = await db
      .update(rentals)
      .set({
        status: 'active',
        actualPickupAt: now,
        handoverByUserId: roleSession.user.id,
        ...(data.startMileage != null ? { startMileage: data.startMileage } : {}),
        ...(data.depositPaidSen != null ? { depositPaidSen: data.depositPaidSen } : {}),
        startConditionNote: data.startConditionNote ?? null,
        ...(data.assignedCarId
          ? {
              fulfillmentSource: 'owned' as const,
              assignedCarId: data.assignedCarId,
              tempPlateLabel: null,
              plateConfirmedAt: now,
            }
          : {}),
        ...(paymentSen > 0
          ? {
              paidAmountSen: newPaidSen,
              paymentStatus: derivePaymentStatus(newPaidSen, rental.totalAmountSen),
            }
          : {}),
        updatedAt: now,
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    if (paymentSen > 0) {
      await db.insert(payments).values({
        rentalId: data.rentalId,
        provider: 'manual',
        amountSen: paymentSen,
        status: 'successful',
        paymentMethod: data.paymentMethod ?? 'cash',
        respondedAt: now,
      })
    }

    await auditRentalAction(roleSession, 'booking.handover', data.rentalId, {
      after: {
        status: 'active',
        ...(data.startMileage != null ? { startMileage: data.startMileage } : {}),
        startConditionNote: data.startConditionNote ?? null,
        ...(data.assignedCarId ? { assignedCarId: data.assignedCarId } : {}),
        ...(data.depositPaidSen != null && data.depositPaidSen > 0
          ? { depositPaidSen: data.depositPaidSen }
          : {}),
        ...(paymentSen > 0
          ? {
              paymentAmountSen: paymentSen,
              paymentMethod: data.paymentMethod ?? 'cash',
              paidAmountSen: newPaidSen,
            }
          : {}),
      },
    })

    return result[0]
  })

export const closeReturn = createServerFn({ method: 'POST' })
  .inputValidator((input: CloseReturnInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        totalAmountSen: rentals.totalAmountSen,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        dailyRateSen: rentals.dailyRateSen,
        actualPickupAt: rentals.actualPickupAt,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'active') throw new Error('Only active rentals can be closed.')

    const now = new Date()

    // Late return surcharge: recalculated from the actual pickup datetime.
    // Extra whole hours beyond the booked window are billed at the car's
    // configured seasonal extra-hour rate (ext_hour_low_sen for Low season,
    // ext_hour_peak_and_super_peak_sen otherwise), based on the season of the
    // scheduled return day. The total surcharge is capped at that season's
    // daily rate — it must never exceed one extra day. Fuel top-up is added
    // on top when provided.
    let lateFeeSen = 0
    let extraHours = 0
    let extraHourRateSen = 0
    let extraHourCapSen = 0
    if (rental.actualPickupAt) {
      const bookedMs = rental.endDate.getTime() - rental.startDate.getTime()
      const actualMs = now.getTime() - rental.actualPickupAt.getTime()
      const extraMs = actualMs - bookedMs
      if (extraMs > 0 && rental.dailyRateSen > 0) {
        extraHours = Math.ceil(extraMs / 3_600_000)

        const carPricing = await db
          .select({
            extHourLowSen: cars.extHourLowSen,
            extHourPeakAndSuperPeakSen: cars.extHourPeakAndSuperPeakSen,
            priceLowSeasonSen: cars.priceLowSeasonSen,
            pricePeakSeasonSen: cars.pricePeakSeasonSen,
            priceSuperPeakSeasonSen: cars.priceSuperPeakSeasonSen,
          })
          .from(cars)
          .where(eq(cars.id, rental.carId))
          .limit(1)
        const pricing = carPricing[0]

        if (pricing) {
          const { seasonCalendar } = await import('#/db/schema')
          const { lookupSeason } = await import('#/lib/pricing-logic')
          const calendarRows = await db.select().from(seasonCalendar)
          const calendar = calendarRows.map((r) => ({
            fromDate: r.fromDate,
            toDate: r.toDate,
            seasonType: r.seasonType,
          }))
          const seasonType = lookupSeason(rental.endDate, calendar)

          const configuredRateSen =
            seasonType === 'Low' ? pricing.extHourLowSen : pricing.extHourPeakAndSuperPeakSen
          // Fall back to 1/24 of the booking daily rate only when the
          // seasonal extra-hour rate has not been configured.
          extraHourRateSen =
            configuredRateSen > 0 ? configuredRateSen : Math.round(rental.dailyRateSen / 24)
          const seasonDayRateSen =
            seasonType === 'Low'
              ? pricing.priceLowSeasonSen
              : seasonType === 'Peak'
                ? pricing.pricePeakSeasonSen
                : pricing.priceSuperPeakSeasonSen
          extraHourCapSen = seasonDayRateSen > 0 ? seasonDayRateSen : rental.dailyRateSen

          lateFeeSen = Math.min(extraHours * extraHourRateSen, extraHourCapSen)
        } else {
          extraHourRateSen = Math.round(rental.dailyRateSen / 24)
          extraHourCapSen = rental.dailyRateSen
          lateFeeSen = Math.min(extraHours * extraHourRateSen, extraHourCapSen)
        }
      }
    }
    const fuelFeeSen = Math.max(0, Math.round(data.fuelFeeSen ?? 0))
    const newTotalSen = rental.totalAmountSen + lateFeeSen + fuelFeeSen

    const paymentStatus = derivePaymentStatus(data.paidAmountSen, newTotalSen)

    // Only single-slot models use cars.status as the live inventory signal.
    // Multi-unit catalog rows stay available while concurrent jobs are open.
    const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      const newCarStatus = data.flagDamage ? 'damaged' : 'available'
      await db
        .update(cars)
        .set({ status: newCarStatus, updatedAt: now })
        .where(eq(cars.id, rental.carId))
    }

    const endNote =
      data.flagDamage && data.endConditionNote
        ? `[DAMAGE] ${data.endConditionNote}`
        : data.flagDamage
          ? '[DAMAGE] Flagged on return'
          : (data.endConditionNote ?? null)

    const result = await db
      .update(rentals)
      .set({
        status: 'closed',
        paymentStatus,
        endMileage: data.endMileage,
        endConditionNote: endNote,
        paidAmountSen: data.paidAmountSen,
        actualReturnDate: now,
        returnByUserId: roleSession.user.id,
        fuelFeeSen,
        ...(lateFeeSen > 0 || fuelFeeSen > 0 ? { totalAmountSen: newTotalSen } : {}),
        updatedAt: now,
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    // Record the payment if amount > 0
    if (data.paidAmountSen > 0) {
      await db.insert(payments).values({
        rentalId: data.rentalId,
        provider: 'manual',
        amountSen: data.paidAmountSen,
        status: 'successful',
        paymentMethod: data.paymentMethod,
        respondedAt: now,
      })
    }

    // Phase 3.6: rental closed → flip pending attribution to earned.
    try {
      const { flipAttributionForRentalStatus } = await import(
        '#/lib/affiliate-functions'
      )
      await flipAttributionForRentalStatus(db, data.rentalId, 'closed')
    } catch {
      // never fail the close because of attribution
    }

    await auditRentalAction(roleSession, 'booking.close', data.rentalId, {
      after: {
        status: 'closed',
        endMileage: data.endMileage,
        paidAmountSen: data.paidAmountSen,
        paymentMethod: data.paymentMethod,
        paymentStatus,
        flagDamage: data.flagDamage ?? false,
        ...(extraHours > 0
          ? { lateExtraHours: extraHours, lateFeeSen, extraHourRateSen, extraHourCapSen }
          : {}),
        ...(fuelFeeSen > 0 ? { fuelFeeSen } : {}),
      },
    })

    return result[0]
  })

export const cancelRental = createServerFn({ method: 'POST' })
  .inputValidator((input: CancelRentalInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({ id: rentals.id, carId: rentals.carId, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'pending') throw new Error('Only pending rentals can be cancelled.')

    const fleetCapacity = await getCarFleetCapacity(db, rental.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(cars.id, rental.carId))
    }

    const result = await db
      .update(rentals)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    // Phase 3.6: rental cancelled → flip pending attribution to voided.
    try {
      const { flipAttributionForRentalStatus } = await import(
        '#/lib/affiliate-functions'
      )
      await flipAttributionForRentalStatus(db, data.rentalId, 'cancelled')
    } catch {
      // never fail the cancel because of attribution
    }

    await auditRentalAction(roleSession, 'booking.cancel', data.rentalId, {
      before: { status: 'pending' },
      after: { status: 'cancelled' },
    })

    return result[0]
  })

export const extendRental = createServerFn({ method: 'POST' })
  .inputValidator((input: ExtendRentalInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        dailyRateSen: rentals.dailyRateSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'active') throw new Error('Only active rentals can be extended.')

    const newEndDate = new Date(data.newEndDate)
    if (isNaN(newEndDate.getTime())) throw new Error('Invalid date.')
    if (newEndDate <= rental.startDate)
      throw new Error('New end date must be after the rental start date.')

    await assertCarHasBookingCapacity(db, {
      carId: rental.carId,
      tripStart: rental.startDate,
      tripEnd: newEndDate,
      excludeRentalId: data.rentalId,
      errorMessage: 'Cannot extend — another booking overlaps with the new end date.',
    })

    const newTotalSen = calcTotalSen(rental.dailyRateSen, rental.startDate, newEndDate)

    const result = await db
      .update(rentals)
      .set({ endDate: newEndDate, totalAmountSen: newTotalSen, updatedAt: new Date() })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    await auditRentalAction(roleSession, 'booking.extend', data.rentalId, {
      before: { endDate: rental.endDate.toISOString() },
      after: { endDate: newEndDate.toISOString(), totalAmountSen: newTotalSen },
    })

    return result[0]
  })

export const updateRentalBooking = createServerFn({ method: 'POST' })
  .inputValidator((input: UpdateRentalBookingInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        type: rentals.type,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        pickUpTime: rentals.pickUpTime,
        returnTime: rentals.returnTime,
        pickUpLocation: rentals.pickUpLocation,
        returnLocation: rentals.returnLocation,
        dailyRateSen: rentals.dailyRateSen,
        paidAmountSen: rentals.paidAmountSen,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Job not found.')
    if (rental.status !== 'pending' && rental.status !== 'active') {
      throw new Error('Only pending or active jobs can be edited.')
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid dates provided.')
    }
    if (endDate <= startDate) throw new Error('Return date must be after pickup date.')

    const pickUpLocation = data.pickUpLocation.trim()
    const returnLocation = data.returnLocation.trim()
    if (!pickUpLocation) throw new Error('Pickup location is required.')
    if (!returnLocation) throw new Error('Return location is required.')

    await assertCarHasBookingCapacity(db, {
      carId: rental.carId,
      tripStart: startDate,
      tripEnd: endDate,
      excludeRentalId: data.rentalId,
      errorMessage: 'These dates overlap another booking for this car.',
    })

    const totalAmountSen = calcTotalSen(rental.dailyRateSen, startDate, endDate)
    const paymentStatus = derivePaymentStatus(rental.paidAmountSen, totalAmountSen)

    const result = await db
      .update(rentals)
      .set({
        type: data.type,
        startDate,
        endDate,
        pickUpTime: data.pickUpTime.trim() || '09:00:00',
        returnTime: data.returnTime.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        totalAmountSen,
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    await auditRentalAction(roleSession, 'booking.update', data.rentalId, {
      before: {
        type: rental.type,
        startDate: rental.startDate.toISOString(),
        endDate: rental.endDate.toISOString(),
        pickUpTime: rental.pickUpTime,
        returnTime: rental.returnTime,
        pickUpLocation: rental.pickUpLocation,
        returnLocation: rental.returnLocation,
      },
      after: {
        type: data.type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pickUpTime: data.pickUpTime.trim() || '09:00:00',
        returnTime: data.returnTime.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        totalAmountSen,
      },
    })

    return result[0]
  })

/**
 * Admin-only trip edit from the operations "All" table. Unlike
 * updateRentalBooking (pending/active only), admins may adjust pickup/return
 * details on any job that is not yet closed or cancelled.
 */
export const adminUpdateRentalTrip = createServerFn({ method: 'POST' })
  .inputValidator(
    (
      input: UpdateRentalBookingInput & {
        dailyRateSen?: number
        handoverByUserId?: string | null
        actualPickupAt?: string | null
        returnByUserId?: string | null
        actualReturnAt?: string | null
      },
    ) => input,
  )
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({
        id: rentals.id,
        carId: rentals.carId,
        status: rentals.status,
        type: rentals.type,
        startDate: rentals.startDate,
        endDate: rentals.endDate,
        pickUpTime: rentals.pickUpTime,
        returnTime: rentals.returnTime,
        pickUpLocation: rentals.pickUpLocation,
        returnLocation: rentals.returnLocation,
        dailyRateSen: rentals.dailyRateSen,
        paidAmountSen: rentals.paidAmountSen,
        handoverByUserId: rentals.handoverByUserId,
        actualPickupAt: rentals.actualPickupAt,
        returnByUserId: rentals.returnByUserId,
        actualReturnAt: rentals.actualReturnDate,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Job not found.')
    if (rental.status === 'closed' || rental.status === 'cancelled') {
      throw new Error('Closed or cancelled jobs cannot be edited.')
    }

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid dates provided.')
    }
    if (endDate <= startDate) throw new Error('Return date must be after pickup date.')

    const pickUpLocation = data.pickUpLocation.trim()
    const returnLocation = data.returnLocation.trim()
    if (!pickUpLocation) throw new Error('Pickup location is required.')
    if (!returnLocation) throw new Error('Return location is required.')
    if (data.type !== 'booking' && data.type !== 'walk-in') {
      throw new Error('Invalid job type.')
    }

    const dailyRateSen = data.dailyRateSen ?? rental.dailyRateSen
    if (!Number.isInteger(dailyRateSen) || dailyRateSen <= 0) {
      throw new Error('Daily rate must be a positive amount.')
    }

    await assertCarHasBookingCapacity(db, {
      carId: rental.carId,
      tripStart: startDate,
      tripEnd: endDate,
      excludeRentalId: data.rentalId,
      errorMessage: 'These dates overlap another booking for this car.',
    })

    const totalAmountSen = calcTotalSen(dailyRateSen, startDate, endDate)
    const paymentStatus = derivePaymentStatus(rental.paidAmountSen, totalAmountSen)

    const actualPickupAt =
      data.actualPickupAt === undefined
        ? rental.actualPickupAt
        : data.actualPickupAt === null
          ? null
          : new Date(data.actualPickupAt)
    const actualReturnAt =
      data.actualReturnAt === undefined
        ? rental.actualReturnAt
        : data.actualReturnAt === null
          ? null
          : new Date(data.actualReturnAt)
    for (const d of [actualPickupAt, actualReturnAt]) {
      if (d !== null && isNaN(d.getTime())) {
        throw new Error('Invalid handled-by datetime provided.')
      }
    }
    const handoverByUserId =
      data.handoverByUserId === undefined ? rental.handoverByUserId : data.handoverByUserId
    const returnByUserId =
      data.returnByUserId === undefined ? rental.returnByUserId : data.returnByUserId

    const result = await db
      .update(rentals)
      .set({
        type: data.type,
        startDate,
        endDate,
        pickUpTime: data.pickUpTime.trim() || '09:00:00',
        returnTime: data.returnTime.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        dailyRateSen,
        totalAmountSen,
        paymentStatus,
        handoverByUserId,
        actualPickupAt,
        returnByUserId,
        actualReturnDate: actualReturnAt,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, data.rentalId))
      .returning()

    await auditRentalAction(roleSession, 'booking.update', data.rentalId, {
      before: {
        type: rental.type,
        startDate: rental.startDate.toISOString(),
        endDate: rental.endDate.toISOString(),
        pickUpTime: rental.pickUpTime,
        returnTime: rental.returnTime,
        pickUpLocation: rental.pickUpLocation,
        returnLocation: rental.returnLocation,
        dailyRateSen: rental.dailyRateSen,
        handoverByUserId: rental.handoverByUserId,
        actualPickupAt: rental.actualPickupAt?.toISOString() ?? null,
        returnByUserId: rental.returnByUserId,
        actualReturnAt: rental.actualReturnAt?.toISOString() ?? null,
      },
      after: {
        type: data.type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pickUpTime: data.pickUpTime.trim() || '09:00:00',
        returnTime: data.returnTime.trim() || '09:00:00',
        pickUpLocation,
        returnLocation,
        dailyRateSen,
        totalAmountSen,
        handoverByUserId,
        actualPickupAt: actualPickupAt?.toISOString() ?? null,
        returnByUserId,
        actualReturnAt: actualReturnAt?.toISOString() ?? null,
      },
    })

    return result[0]
  })

export const deleteRental = createServerFn({ method: 'POST' })
  .inputValidator((input: DeleteRentalInput) => input)
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fullAdminRoles)
    const { db } = await import('#/db')

    const existing = await db
      .select({ id: rentals.id, status: rentals.status })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)

    const rental = existing[0]
    if (!rental) throw new Error('Rental not found.')
    if (rental.status === 'active')
      throw new Error('Active rentals cannot be deleted. Close or cancel first.')

    try {
      const { recordAuditLog } = await import('#/lib/audit-log')
      await recordAuditLog({
        actorUserId: roleSession.user.id,
        actorRole: roleSession.user.role as AppRole,
        action: 'booking.update',
        entityType: 'rental',
        entityId: data.rentalId,
        before: { status: rental.status },
        after: { deleted: true },
      })
    } catch (err) {
      console.error('[audit] failed to record rental delete', err)
    }

    const result = await db
      .delete(rentals)
      .where(eq(rentals.id, data.rentalId))
      .returning({ id: rentals.id })

    if (!result[0]) throw new Error('Rental not found.')
    return { rentalId: data.rentalId }
  })

const assignRentalFulfillmentSchema = z.object({
  rentalId: uuidString,
  fulfillmentSource: z.enum(['owned', 'partner', 'unassigned']),
  assignedCarId: uuidString.optional().nullable(),
  partnerId: uuidString.optional().nullable(),
  partnerCarModelId: uuidString.optional().nullable(),
  tempPlateLabel: z.string().trim().max(40).optional().nullable(),
})

/** Ops assigns a concrete owned plate, partner hold, or clears to unassigned. */
export const assignRentalFulfillment = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(assignRentalFulfillmentSchema))
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const [existing] = await db
      .select({
        id: rentals.id,
        status: rentals.status,
        carId: rentals.carId,
        fulfillmentSource: rentals.fulfillmentSource,
        assignedCarId: rentals.assignedCarId,
        tempPlateLabel: rentals.tempPlateLabel,
      })
      .from(rentals)
      .where(eq(rentals.id, data.rentalId))
      .limit(1)
    if (!existing) throw new Error('Rental not found.')
    if (existing.status === 'closed' || existing.status === 'cancelled') {
      throw new Error('Cannot reassign a closed or cancelled job.')
    }

    if (data.fulfillmentSource === 'owned') {
      if (!data.assignedCarId) throw new Error('Select an owned plate to assign.')
      const [plate] = await db
        .select({ id: cars.id, ownedByFleet: cars.ownedByFleet, status: cars.status })
        .from(cars)
        .where(eq(cars.id, data.assignedCarId))
        .limit(1)
      if (!plate || !plate.ownedByFleet) throw new Error('Assigned vehicle must be fleet-owned.')
      if (plate.status === 'retired') throw new Error('Cannot assign a retired vehicle.')
    }

    const tempPlateLabel =
      data.fulfillmentSource === 'owned'
        ? null
        : data.tempPlateLabel?.trim() ||
          (data.fulfillmentSource === 'unassigned'
            ? makeTempHoldLabel(data.rentalId)
            : data.tempPlateLabel?.trim() || null)

    const [row] = await db
      .update(rentals)
      .set({
        fulfillmentSource: data.fulfillmentSource,
        assignedCarId:
          data.fulfillmentSource === 'owned' ? (data.assignedCarId ?? null) : null,
        partnerId: data.fulfillmentSource === 'partner' ? (data.partnerId ?? null) : null,
        partnerCarModelId:
          data.fulfillmentSource === 'partner' ? (data.partnerCarModelId ?? null) : null,
        tempPlateLabel,
        plateConfirmedAt: data.fulfillmentSource === 'owned' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(rentals.id, data.rentalId))
      .returning({
        id: rentals.id,
        assignedCarId: rentals.assignedCarId,
        fulfillmentSource: rentals.fulfillmentSource,
        tempPlateLabel: rentals.tempPlateLabel,
      })

    await auditRentalAction(roleSession, 'booking.plate_change', data.rentalId, {
      before: {
        fulfillmentSource: existing.fulfillmentSource,
        assignedCarId: existing.assignedCarId,
        tempPlateLabel: existing.tempPlateLabel,
      },
      after: {
        fulfillmentSource: row.fulfillmentSource,
        assignedCarId: row.assignedCarId,
        tempPlateLabel: row.tempPlateLabel,
      },
    })

    return row
  })

const createJobsFromAvailabilitySchema = z.object({
  carIds: z.array(uuidString).min(1).max(20),
  customerId: uuidString,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickUpTime: z.string().trim().max(16).optional(),
  returnTime: z.string().trim().max(16).optional(),
  pickUpLocation: z.string().trim().min(1).max(200),
  returnLocation: z.string().trim().min(1).max(200),
  deliveryFeeSen: z.number().int().min(0).optional(),
  depositAmountSen: z.number().int().min(0).default(0),
  childSeat: z.boolean().optional().default(false),
  secondDriver: z.boolean().optional().default(false),
  remark: z.string().trim().max(2000).optional(),
  xqBookingId: z.string().trim().max(80).optional(),
  tripType: z.enum(['round', 'oneway']).optional(),
})

/** Batch create in-house jobs from Availability multi-select (listing cars). */
export const createJobsFromAvailability = createServerFn({ method: 'POST' })
  .inputValidator(adminInputValidator(createJobsFromAvailabilitySchema))
  .handler(async ({ data }) => {
    const roleSession = await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')
    const { rentalNotes, seasonCalendar } = await import('#/db/schema')
    const { computeFinalTotal } = await import('#/lib/pricing-logic')
    const { parseBookingDateRange } = await import('#/lib/booking-datetime')
    type CarPricing = import('#/lib/pricing-logic').CarPricing
    type SeasonRange = import('#/lib/pricing-logic').SeasonRange

    const pickUpTime = data.pickUpTime?.trim() || '09:00:00'
    const returnTime = data.returnTime?.trim() || '09:00:00'
    const { startDate, endDate } = parseBookingDateRange(data.startDate, data.endDate)
    if (endDate <= startDate) throw new Error('End date must be after start date.')

    const { auth } = await import('#/lib/auth')
    const { getRequestHeaders } = await import('@tanstack/react-start/server')
    const session = await auth.api.getSession({ headers: getRequestHeaders() })
    const createdByUserId = session?.user?.id ?? null

    const calendarRows = await db.select().from(seasonCalendar)
    const calendar: SeasonRange[] = calendarRows.map((r) => ({
      fromDate: r.fromDate,
      toDate: r.toDate,
      seasonType: r.seasonType,
    }))

    const created: Array<{ id: string; carId: string; fulfillmentSource: RentalFulfillmentSource }> =
      []

    for (const carId of data.carIds) {
      const [car] = await db
        .select({
          id: cars.id,
          model: cars.model,
          status: cars.status,
          availableForBooking: cars.availableForBooking,
          dailyRateSen: cars.dailyRateSen,
          priceLowSeasonSen: cars.priceLowSeasonSen,
          pricePeakSeasonSen: cars.pricePeakSeasonSen,
          priceSuperPeakSeasonSen: cars.priceSuperPeakSeasonSen,
          extHourLowSen: cars.extHourLowSen,
          extHourPeakAndSuperPeakSen: cars.extHourPeakAndSuperPeakSen,
          deliveryFeeAirportSen: cars.deliveryFeeAirportSen,
          deliveryFeeJettySen: cars.deliveryFeeJettySen,
          deliveryFeeHotelSen: cars.deliveryFeeHotelSen,
          minRentalDays: cars.minRentalDays,
          maxRentalDays: cars.maxRentalDays,
        })
        .from(cars)
        .where(eq(cars.id, carId))
        .limit(1)
      if (!car) throw new Error(`Vehicle not found: ${carId}`)
      if (car.status === 'retired') throw new Error(`Vehicle is retired: ${carId}`)

      const fleetCapacity = await assertCarHasBookingCapacity(db, {
        carId,
        tripStart: startDate,
        tripEnd: endDate,
        errorMessage: `No capacity left for one of the selected vehicles on these dates.`,
      })

      const rentalId = crypto.randomUUID()
      const fulfillment = await resolveFulfillmentForListingCar(db, {
        listingCarId: carId,
        tripStart: startDate,
        tripEnd: endDate,
        rentalIdForTempLabel: rentalId,
      })

      const pricingCar: CarPricing = {
        status: car.status === 'available' ? 'Active' : car.status,
        availableForBooking: car.availableForBooking,
        priceLowSeasonSen: car.priceLowSeasonSen,
        pricePeakSeasonSen: car.pricePeakSeasonSen,
        priceSuperPeakSeasonSen: car.priceSuperPeakSeasonSen,
        extHourLowSen: car.extHourLowSen,
        extHourPeakAndSuperPeakSen: car.extHourPeakAndSuperPeakSen,
        deliveryFeeAirportSen: car.deliveryFeeAirportSen,
        deliveryFeeJettySen: car.deliveryFeeJettySen,
        deliveryFeeHotelSen: car.deliveryFeeHotelSen,
        minRentalDays: car.minRentalDays,
        maxRentalDays: car.maxRentalDays,
      }

      const pricing = computeFinalTotal(
        pricingCar,
        startDate,
        pickUpTime,
        endDate,
        returnTime,
        data.pickUpLocation,
        data.returnLocation,
        { childSeat: data.childSeat ?? false, secondDriver: data.secondDriver ?? false },
        calendar,
        [],
      )
      if ('error' in pricing) throw new Error(pricing.error)

      const addonsTotalSen = Math.round(pricing.addonsTotal * 100)
      const deliveryFeeSen =
        data.deliveryFeeSen ?? Math.round(pricing.deliveryFee * 100)
      const totalAmountSen = Math.round(pricing.finalTotal * 100)
      const baseRentalSen = Math.round(pricing.baseRental * 100)
      const extraChargeSen = Math.round(pricing.extraCharge * 100)

      if (usesSingleUnitCarStatus(fleetCapacity)) {
        await db
          .update(cars)
          .set({ status: 'reserved', updatedAt: new Date() })
          .where(eq(cars.id, carId))
      }

      const [row] = await db
        .insert(rentals)
        .values({
          id: rentalId,
          carId,
          assignedCarId: fulfillment.assignedCarId,
          fulfillmentSource: fulfillment.fulfillmentSource,
          partnerId: fulfillment.partnerId,
          partnerCarModelId: fulfillment.partnerCarModelId,
          tempPlateLabel: fulfillment.tempPlateLabel,
          plateConfirmedAt: fulfillment.plateConfirmedAt,
          customerId: data.customerId,
          type: 'walk-in',
          status: 'pending',
          paymentStatus: 'unpaid',
          tripType:
            data.tripType ??
            (data.pickUpLocation.trim() !== data.returnLocation.trim() ? 'oneway' : 'round'),
          bookingExpiresAt: new Date(Date.now() + BOOKING_WINDOW_MS),
          startDate,
          endDate,
          pickUpTime,
          returnTime,
          pickUpLocation: data.pickUpLocation.trim(),
          returnLocation: data.returnLocation.trim(),
          childSeat: data.childSeat ?? false,
          secondDriver: data.secondDriver ?? false,
          deliveryFeeSen,
          dailyRateSen: car.dailyRateSen,
          baseRentalSen,
          extraHoursDecimal: String(pricing.extraHours),
          extraChargeSen,
          extraRule: pricing.extraRule,
          addonsTotalSen,
          subTotalSen: Math.round(pricing.subTotal * 100),
          totalAmountSen,
          depositAmountSen: fixedDepositSenForModel(car.model),
          paidAmountSen: 0,
          createdByUserId,
        })
        .returning({
          id: rentals.id,
          carId: rentals.carId,
          fulfillmentSource: rentals.fulfillmentSource,
        })

      if (row) {
        created.push(row)
        await auditRentalAction(roleSession, 'booking.create', row.id, {
          after: {
            type: 'walk-in',
            source: 'availability',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalAmountSen,
            fulfillmentSource: row.fulfillmentSource,
          },
        })
        const noteParts = [
          data.xqBookingId?.trim() ? `XQ Booking ID: ${data.xqBookingId.trim()}` : null,
          data.remark?.trim() || null,
        ].filter(Boolean)
        if (noteParts.length > 0) {
          await db.insert(rentalNotes).values({
            rentalId: row.id,
            authorUserId: createdByUserId,
            body: noteParts.join('\n'),
          })
        }
      }
    }

    return { created, count: created.length }
  })
