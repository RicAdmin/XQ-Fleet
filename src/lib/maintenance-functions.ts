import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, lt, sql } from 'drizzle-orm'

import { carServiceConfig, cars, maintenanceEvents } from '#/db/schema'
import type { MaintenanceEventStatus, MaintenanceEventType } from '#/db/schema'
import { requireRole } from '#/lib/auth-functions'
import { fleetOpsRoles } from '#/lib/auth-model'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaintenanceEventRow = {
  id: string
  carId: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  type: MaintenanceEventType
  description: string
  mileageAtService: number | null
  costSen: number
  workshopVendor: string | null
  status: MaintenanceEventStatus
  openedAt: Date
  completedAt: Date | null
  nextDueMileage: number | null
  nextDueDate: Date | null
}

export type CarServiceConfigRow = {
  carId: string
  serviceIntervalKm: number | null
  serviceIntervalDays: number | null
  alertBeforeKm: number
  alertBeforeDays: number
  roadTaxExpiryDate: Date | null
  roadTaxRenewalCostSen: number
  roadTaxPolicyRef: string | null
  insuranceExpiryDate: Date | null
  insuranceRenewalCostSen: number
  insurancePolicyRef: string | null
}

export type MaintenanceAlertRow = {
  carId: string
  carPlateNumber: string
  carMake: string | null
  carModel: string | null
  alertType: 'open-event' | 'service-km' | 'service-days' | 'road-tax' | 'insurance'
  message: string
  severity: 'red' | 'amber'
}

export type MaintenanceReportRow = {
  id: string
  carPlateNumber: string | null
  carMake: string | null
  carModel: string | null
  type: MaintenanceEventType
  description: string
  costSen: number
  workshopVendor: string | null
  openedAt: Date
  completedAt: Date | null
  status: MaintenanceEventStatus
}

export type MaintenanceReport = {
  rows: MaintenanceReportRow[]
  totalCostSen: number
  from: string
  to: string
}

// ─── Server functions ─────────────────────────────────────────────────────────

export const getCarMaintenanceEvents = createServerFn({ method: 'GET' })
  .inputValidator((data: { carId: string }) => data)
  .handler(async ({ data }): Promise<MaintenanceEventRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const rows = await db
      .select({
        id: maintenanceEvents.id,
        carId: maintenanceEvents.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        type: maintenanceEvents.type,
        description: maintenanceEvents.description,
        mileageAtService: maintenanceEvents.mileageAtService,
        costSen: maintenanceEvents.costSen,
        workshopVendor: maintenanceEvents.workshopVendor,
        status: maintenanceEvents.status,
        openedAt: maintenanceEvents.openedAt,
        completedAt: maintenanceEvents.completedAt,
        nextDueMileage: maintenanceEvents.nextDueMileage,
        nextDueDate: maintenanceEvents.nextDueDate,
      })
      .from(maintenanceEvents)
      .leftJoin(cars, eq(maintenanceEvents.carId, cars.id))
      .where(eq(maintenanceEvents.carId, data.carId))
      .orderBy(desc(maintenanceEvents.openedAt))

    return rows
  })

export const getCarServiceConfig = createServerFn({ method: 'GET' })
  .inputValidator((data: { carId: string }) => data)
  .handler(async ({ data }): Promise<CarServiceConfigRow | null> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const [row] = await db
      .select()
      .from(carServiceConfig)
      .where(eq(carServiceConfig.carId, data.carId))
      .limit(1)

    return row ?? null
  })

export const upsertCarServiceConfig = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      carId: string
      serviceIntervalKm?: number | null
      serviceIntervalDays?: number | null
      alertBeforeKm?: number
      alertBeforeDays?: number
      roadTaxExpiryDate?: string | null
      roadTaxRenewalCostSen?: number
      roadTaxPolicyRef?: string | null
      insuranceExpiryDate?: string | null
      insuranceRenewalCostSen?: number
      insurancePolicyRef?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const values = {
      carId: data.carId,
      serviceIntervalKm: data.serviceIntervalKm ?? null,
      serviceIntervalDays: data.serviceIntervalDays ?? null,
      alertBeforeKm: data.alertBeforeKm ?? 500,
      alertBeforeDays: data.alertBeforeDays ?? 7,
      roadTaxExpiryDate: data.roadTaxExpiryDate ? new Date(data.roadTaxExpiryDate) : null,
      roadTaxRenewalCostSen: data.roadTaxRenewalCostSen ?? 0,
      roadTaxPolicyRef: data.roadTaxPolicyRef ?? null,
      insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : null,
      insuranceRenewalCostSen: data.insuranceRenewalCostSen ?? 0,
      insurancePolicyRef: data.insurancePolicyRef ?? null,
      updatedAt: new Date(),
    }

    await db
      .insert(carServiceConfig)
      .values(values)
      .onConflictDoUpdate({ target: carServiceConfig.carId, set: values })

    return { ok: true }
  })

export const createMaintenanceEvent = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      carId: string
      type: MaintenanceEventType
      description: string
      mileageAtService?: number | null
      costSen?: number
      workshopVendor?: string | null
      nextDueMileage?: number | null
      nextDueDate?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const [event] = await db
      .insert(maintenanceEvents)
      .values({
        carId: data.carId,
        type: data.type,
        description: data.description,
        mileageAtService: data.mileageAtService ?? null,
        costSen: data.costSen ?? 0,
        workshopVendor: data.workshopVendor ?? null,
        nextDueMileage: data.nextDueMileage ?? null,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        status: 'open',
        openedAt: new Date(),
      })
      .returning({ id: maintenanceEvents.id })

    // Transition car to maintenance status
    await db
      .update(cars)
      .set({
        status: 'maintenance',
        ...(data.mileageAtService != null ? { currentMileage: data.mileageAtService } : {}),
        updatedAt: new Date(),
      })
      .where(eq(cars.id, data.carId))

    return { id: event!.id }
  })

export const closeMaintenanceEvent = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      eventId: string
      mileageAtService?: number | null
      costSen?: number
      workshopVendor?: string | null
      nextDueMileage?: number | null
      nextDueDate?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    // Load event to get carId
    const [event] = await db
      .select({ id: maintenanceEvents.id, carId: maintenanceEvents.carId })
      .from(maintenanceEvents)
      .where(eq(maintenanceEvents.id, data.eventId))
      .limit(1)

    if (!event) throw new Error('Maintenance event not found')

    await db
      .update(maintenanceEvents)
      .set({
        status: 'completed',
        completedAt: new Date(),
        ...(data.mileageAtService != null ? { mileageAtService: data.mileageAtService } : {}),
        ...(data.costSen != null ? { costSen: data.costSen } : {}),
        ...(data.workshopVendor != null ? { workshopVendor: data.workshopVendor } : {}),
        ...(data.nextDueMileage != null ? { nextDueMileage: data.nextDueMileage } : {}),
        ...(data.nextDueDate ? { nextDueDate: new Date(data.nextDueDate) } : {}),
        updatedAt: new Date(),
      })
      .where(eq(maintenanceEvents.id, data.eventId))

    // Update car mileage if provided
    if (data.mileageAtService != null) {
      await db
        .update(cars)
        .set({ currentMileage: data.mileageAtService, updatedAt: new Date() })
        .where(eq(cars.id, event.carId))
    }

    // Only transition back to 'available' if no other open events remain
    const [{ openCount }] = await db
      .select({ openCount: sql<number>`count(*)::int` })
      .from(maintenanceEvents)
      .where(and(eq(maintenanceEvents.carId, event.carId), eq(maintenanceEvents.status, 'open')))

    if (Number(openCount) === 0) {
      await db
        .update(cars)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(cars.id, event.carId))
    }

    return { ok: true }
  })

export const getAllMaintenanceEvents = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { statusFilter?: MaintenanceEventStatus | 'all' }) => data,
  )
  .handler(async ({ data }): Promise<MaintenanceEventRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const where =
      data.statusFilter && data.statusFilter !== 'all'
        ? eq(maintenanceEvents.status, data.statusFilter)
        : undefined

    const rows = await db
      .select({
        id: maintenanceEvents.id,
        carId: maintenanceEvents.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        type: maintenanceEvents.type,
        description: maintenanceEvents.description,
        mileageAtService: maintenanceEvents.mileageAtService,
        costSen: maintenanceEvents.costSen,
        workshopVendor: maintenanceEvents.workshopVendor,
        status: maintenanceEvents.status,
        openedAt: maintenanceEvents.openedAt,
        completedAt: maintenanceEvents.completedAt,
        nextDueMileage: maintenanceEvents.nextDueMileage,
        nextDueDate: maintenanceEvents.nextDueDate,
      })
      .from(maintenanceEvents)
      .leftJoin(cars, eq(maintenanceEvents.carId, cars.id))
      .where(where)
      .orderBy(desc(maintenanceEvents.openedAt))

    return rows
  })

export const getMaintenanceDashboardAlerts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MaintenanceAlertRow[]> => {
    await requireRole(fleetOpsRoles)
    const { db } = await import('#/db')

    const alerts: MaintenanceAlertRow[] = []
    const nowPlus30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // 1. Open maintenance events — red severity
    const openEvents = await db
      .select({
        carId: maintenanceEvents.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        type: maintenanceEvents.type,
        description: maintenanceEvents.description,
      })
      .from(maintenanceEvents)
      .leftJoin(cars, eq(maintenanceEvents.carId, cars.id))
      .where(eq(maintenanceEvents.status, 'open'))
      .orderBy(asc(maintenanceEvents.openedAt))

    for (const ev of openEvents) {
      alerts.push({
        carId: ev.carId,
        carPlateNumber: ev.carPlateNumber ?? '',
        carMake: ev.carMake,
        carModel: ev.carModel,
        alertType: 'open-event',
        message: `${ev.carPlateNumber ?? 'Car'}: Open ${ev.type} — ${ev.description}`,
        severity: 'red',
      })
    }

    // 2. Approaching service by km (currentMileage within alertBeforeKm of nextDueMileage)
    const upcomingKm = await db
      .select({
        carId: maintenanceEvents.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        nextDueMileage: maintenanceEvents.nextDueMileage,
        currentMileage: cars.currentMileage,
        alertBeforeKm: carServiceConfig.alertBeforeKm,
      })
      .from(maintenanceEvents)
      .leftJoin(cars, eq(maintenanceEvents.carId, cars.id))
      .leftJoin(carServiceConfig, eq(maintenanceEvents.carId, carServiceConfig.carId))
      .where(
        and(
          eq(maintenanceEvents.status, 'completed'),
          sql`${maintenanceEvents.nextDueMileage} is not null`,
          sql`${cars.currentMileage} is not null`,
          sql`${cars.currentMileage} >= (${maintenanceEvents.nextDueMileage} - coalesce(${carServiceConfig.alertBeforeKm}, 500))`,
        ),
      )

    for (const row of upcomingKm) {
      if (row.nextDueMileage == null || row.currentMileage == null) continue
      const kmLeft = row.nextDueMileage - row.currentMileage
      alerts.push({
        carId: row.carId,
        carPlateNumber: row.carPlateNumber ?? '',
        carMake: row.carMake,
        carModel: row.carModel,
        alertType: 'service-km',
        message: `${row.carPlateNumber ?? 'Car'}: Service due in ${kmLeft} km`,
        severity: 'amber',
      })
    }

    // 3. Approaching service by date
    const upcomingDays = await db
      .select({
        carId: maintenanceEvents.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        nextDueDate: maintenanceEvents.nextDueDate,
        alertBeforeDays: carServiceConfig.alertBeforeDays,
      })
      .from(maintenanceEvents)
      .leftJoin(cars, eq(maintenanceEvents.carId, cars.id))
      .leftJoin(carServiceConfig, eq(maintenanceEvents.carId, carServiceConfig.carId))
      .where(
        and(
          eq(maintenanceEvents.status, 'completed'),
          sql`${maintenanceEvents.nextDueDate} is not null`,
          sql`${maintenanceEvents.nextDueDate} <= now() + (coalesce(${carServiceConfig.alertBeforeDays}, 7) || ' days')::interval`,
          sql`${maintenanceEvents.nextDueDate} >= now()`,
        ),
      )

    for (const row of upcomingDays) {
      if (!row.nextDueDate) continue
      const daysLeft = Math.ceil((row.nextDueDate.getTime() - Date.now()) / 86400000)
      alerts.push({
        carId: row.carId,
        carPlateNumber: row.carPlateNumber ?? '',
        carMake: row.carMake,
        carModel: row.carModel,
        alertType: 'service-days',
        message: `${row.carPlateNumber ?? 'Car'}: Service due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        severity: 'amber',
      })
    }

    // 4. Road tax expiring within 30 days
    const roadTaxExpiring = await db
      .select({
        carId: carServiceConfig.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        roadTaxExpiryDate: carServiceConfig.roadTaxExpiryDate,
      })
      .from(carServiceConfig)
      .leftJoin(cars, eq(carServiceConfig.carId, cars.id))
      .where(
        and(
          sql`${carServiceConfig.roadTaxExpiryDate} is not null`,
          lt(carServiceConfig.roadTaxExpiryDate, nowPlus30),
          sql`${carServiceConfig.roadTaxExpiryDate} >= now()`,
        ),
      )

    for (const row of roadTaxExpiring) {
      if (!row.roadTaxExpiryDate) continue
      const daysLeft = Math.ceil((row.roadTaxExpiryDate.getTime() - Date.now()) / 86400000)
      alerts.push({
        carId: row.carId,
        carPlateNumber: row.carPlateNumber ?? '',
        carMake: row.carMake,
        carModel: row.carModel,
        alertType: 'road-tax',
        message: `${row.carPlateNumber ?? 'Car'}: Road tax expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        severity: daysLeft <= 7 ? 'red' : 'amber',
      })
    }

    // 5. Insurance expiring within 30 days
    const insuranceExpiring = await db
      .select({
        carId: carServiceConfig.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        insuranceExpiryDate: carServiceConfig.insuranceExpiryDate,
      })
      .from(carServiceConfig)
      .leftJoin(cars, eq(carServiceConfig.carId, cars.id))
      .where(
        and(
          sql`${carServiceConfig.insuranceExpiryDate} is not null`,
          lt(carServiceConfig.insuranceExpiryDate, nowPlus30),
          sql`${carServiceConfig.insuranceExpiryDate} >= now()`,
        ),
      )

    for (const row of insuranceExpiring) {
      if (!row.insuranceExpiryDate) continue
      const daysLeft = Math.ceil((row.insuranceExpiryDate.getTime() - Date.now()) / 86400000)
      alerts.push({
        carId: row.carId,
        carPlateNumber: row.carPlateNumber ?? '',
        carMake: row.carMake,
        carModel: row.carModel,
        alertType: 'insurance',
        message: `${row.carPlateNumber ?? 'Car'}: Insurance expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        severity: daysLeft <= 7 ? 'red' : 'amber',
      })
    }

    // 6. Overdue road tax
    const roadTaxOverdue = await db
      .select({
        carId: carServiceConfig.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        roadTaxExpiryDate: carServiceConfig.roadTaxExpiryDate,
      })
      .from(carServiceConfig)
      .leftJoin(cars, eq(carServiceConfig.carId, cars.id))
      .where(
        and(
          sql`${carServiceConfig.roadTaxExpiryDate} is not null`,
          sql`${carServiceConfig.roadTaxExpiryDate} < now()`,
        ),
      )

    for (const row of roadTaxOverdue) {
      alerts.push({
        carId: row.carId,
        carPlateNumber: row.carPlateNumber ?? '',
        carMake: row.carMake,
        carModel: row.carModel,
        alertType: 'road-tax',
        message: `${row.carPlateNumber ?? 'Car'}: Road tax EXPIRED`,
        severity: 'red',
      })
    }

    // 7. Overdue insurance
    const insuranceOverdue = await db
      .select({
        carId: carServiceConfig.carId,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        insuranceExpiryDate: carServiceConfig.insuranceExpiryDate,
      })
      .from(carServiceConfig)
      .leftJoin(cars, eq(carServiceConfig.carId, cars.id))
      .where(
        and(
          sql`${carServiceConfig.insuranceExpiryDate} is not null`,
          sql`${carServiceConfig.insuranceExpiryDate} < now()`,
        ),
      )

    for (const row of insuranceOverdue) {
      alerts.push({
        carId: row.carId,
        carPlateNumber: row.carPlateNumber ?? '',
        carMake: row.carMake,
        carModel: row.carModel,
        alertType: 'insurance',
        message: `${row.carPlateNumber ?? 'Car'}: Insurance EXPIRED`,
        severity: 'red',
      })
    }

    return alerts
  },
)

export const deleteMaintenanceEvent = createServerFn({ method: 'POST' })
  .inputValidator((data: { eventId: string }) => data)
  .handler(async ({ data }) => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const matchingEvents = await db
      .select({ id: maintenanceEvents.id, carId: maintenanceEvents.carId, status: maintenanceEvents.status })
      .from(maintenanceEvents)
      .where(eq(maintenanceEvents.id, data.eventId))
      .limit(1)
    const event = matchingEvents.at(0)

    if (!event) throw new Error('Maintenance event not found')

    await db.delete(maintenanceEvents).where(eq(maintenanceEvents.id, data.eventId))

    // If it was open, check if car still has other open events; if not, set available
    if (event.status === 'open') {
      const [{ openCount }] = await db
        .select({ openCount: sql<number>`count(*)::int` })
        .from(maintenanceEvents)
        .where(and(eq(maintenanceEvents.carId, event.carId), eq(maintenanceEvents.status, 'open')))

      if (Number(openCount) === 0) {
        await db
          .update(cars)
          .set({ status: 'available', updatedAt: new Date() })
          .where(eq(cars.id, event.carId))
      }
    }

    return { ok: true }
  })

export const getMaintenanceReport = createServerFn({ method: 'GET' })
  .inputValidator((data: { from: string; to: string }) => data)
  .handler(async ({ data }): Promise<MaintenanceReport> => {
    await requireRole(['owner'])
    const { db } = await import('#/db')

    const fromDate = new Date(data.from)
    const toDate = new Date(data.to)
    toDate.setUTCHours(23, 59, 59, 999)

    const rows = await db
      .select({
        id: maintenanceEvents.id,
        carPlateNumber: cars.plateNumber,
        carMake: cars.make,
        carModel: cars.model,
        type: maintenanceEvents.type,
        description: maintenanceEvents.description,
        costSen: maintenanceEvents.costSen,
        workshopVendor: maintenanceEvents.workshopVendor,
        openedAt: maintenanceEvents.openedAt,
        completedAt: maintenanceEvents.completedAt,
        status: maintenanceEvents.status,
      })
      .from(maintenanceEvents)
      .leftJoin(cars, eq(maintenanceEvents.carId, cars.id))
      .where(
        and(
          sql`${maintenanceEvents.openedAt} >= ${fromDate}`,
          sql`${maintenanceEvents.openedAt} <= ${toDate}`,
        ),
      )
      .orderBy(desc(maintenanceEvents.openedAt))

    const totalCostSen = rows.reduce((sum, r) => sum + r.costSen, 0)

    return { rows, totalCostSen, from: data.from, to: data.to }
  })
