import { useEffect, useState } from 'react'

import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { History, LayoutGrid, Pencil, Plus, Wrench } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { isFullAdminRole, type AppRole } from '#/lib/auth-model'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { CarCategory, CarColor, CarStatus, MaintenanceEventType } from '#/db/schema'
import {
  getCarById,
  updateCar,
} from '#/lib/car-functions'
import {
  deriveCarDisplayStatus,
  pickOpenRentalForDisplay,
} from '#/lib/car-display-status'
import type { CarServiceConfigRow, MaintenanceEventRow } from '#/lib/maintenance-functions'
import {
  closeMaintenanceEvent,
  createMaintenanceEvent,
  getCarMaintenanceEvents,
  getCarServiceConfig,
  upsertCarServiceConfig,
} from '#/lib/maintenance-functions'
import { getRentalsByCarId, getOpenRentalsByCarId } from '#/lib/rental-functions'

export const Route = createFileRoute('/admin/cars/$carId')({
  beforeLoad: async ({ params, cause }) => {
    if (cause === 'preload') return
    const car = await getCarById({ data: { carId: params.carId } })
    if (!car) throw notFound()
    return { car }
  },
  component: CarDetailPage,
})

const DETAIL_TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutGrid },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench },
  { value: 'history', label: 'History', icon: History },
] as const

function ConfigValueField({
  label,
  value,
  placeholder,
  remark,
  remarkPlaceholder,
}: {
  label: string
  value: string | null
  placeholder: string
  remark?: string | null
  remarkPlaceholder?: string
}) {
  if (!value) {
    return (
      <div className="maint-config-card">
        <label className="maint-config-label">{label}</label>
        <input
          type="text"
          className="field-input maint-sample-input"
          disabled
          readOnly
          value=""
          placeholder={placeholder}
          aria-label={`${label} sample`}
        />
        {remarkPlaceholder ? (
          <input
            type="text"
            className="field-input maint-sample-input mt-2"
            disabled
            readOnly
            value=""
            placeholder={remarkPlaceholder}
            aria-label={`${label} remark sample`}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="maint-config-card">
      <p className="maint-config-label">{label}</p>
      <p className="maint-config-value">{value}</p>
      {remark ? <p className="maint-config-ref">{remark}</p> : null}
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { value: CarColor; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'silver', label: 'Silver' },
  { value: 'grey', label: 'Grey' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'dark-blue', label: 'Dark Blue' },
  { value: 'maroon', label: 'Maroon' },
  { value: 'gold', label: 'Gold' },
  { value: 'beige', label: 'Beige' },
  { value: 'green', label: 'Green' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_OPTIONS: { value: CarCategory; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'mpv', label: 'MPV' },
  { value: 'suv', label: 'SUV' },
  { value: 'other', label: 'Other' },
]

const COLOR_LABEL: Record<CarColor, string> = Object.fromEntries(
  COLOR_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarColor, string>

const CATEGORY_LABEL: Record<CarCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarCategory, string>

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function currentYear() {
  return new Date().getFullYear()
}

type CarRow = {
  id: string
  plateNumber: string
  make: string
  model: string
  year: number
  color: CarColor
  category: CarCategory
  status: CarStatus
  dailyRateSen: number
  priceLowSeasonSen: number
  pricePeakSeasonSen: number
  priceSuperPeakSeasonSen: number
  extHourLowSen: number
  extHourPeakAndSuperPeakSen: number
  deliveryFeeAirportSen: number
  deliveryFeeJettySen: number
  deliveryFeeHotelSen: number
  lateReturnHourlyFeeSen: number
  promotionalPriceSen: number | null
  minRentalDays: number
  maxRentalDays: number
  numberOfUnits: number
  overbookUnits: number
  currentMileage: number | null
  notes: string | null
  slug: string | null
  featured: boolean
  availableForBooking: boolean
  ownedByFleet: boolean
  vendorName: string | null
  metaTitle: string | null
  metaDescription: string | null
  longDescription: string | null
  highlights: string[] | null
  bodyType: string | null
  passengers: number
  doors: number
  transmission: string | null
  fuelType: string | null
  appleCarPlay: boolean
  androidAuto: boolean
  bootCapacityL: number | null
  bootCapacityLabel: string | null
  largeSuitcasesCount: number | null
  smallCarryonsCount: number | null
  combinedCapacityL: number | null
  combinedCapacityLabel: string | null
  tagFunAdventure: boolean
  tagFamilyComfort: boolean
  tagSmallOku: boolean
  fuelPolicy: string | null
  carLocations: string | null
  createdAt: Date
  updatedAt: Date
}

type CarFormData = {
  plateNumber: string
  make: string
  model: string
  year: string
  color: CarColor
  category: CarCategory
  dailyRateRM: string
  notes: string
}

function carToForm(car: CarRow): CarFormData {
  return {
    plateNumber: car.plateNumber,
    make: car.make,
    model: car.model,
    year: String(car.year),
    color: car.color,
    category: car.category,
    dailyRateRM: (car.dailyRateSen / 100).toFixed(2),
    notes: car.notes ?? '',
  }
}

// ─── Maintenance event type options ──────────────────────────────────────────

const EVENT_TYPE_OPTIONS: { value: MaintenanceEventType; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled service' },
  { value: 'unscheduled', label: 'Unscheduled repair' },
  { value: 'damage', label: 'Damage repair' },
  { value: 'road-tax', label: 'Road tax renewal' },
  { value: 'insurance', label: 'Insurance renewal' },
]

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function maintenanceEventTypeBadge(type: MaintenanceEventType): string {
  const map: Record<MaintenanceEventType, string> = {
    scheduled: 'Scheduled',
    unscheduled: 'Unscheduled',
    damage: 'Damage',
    'road-tax': 'Road tax',
    insurance: 'Insurance',
  }
  return map[type]
}

// ─── Component ────────────────────────────────────────────────────────────────

function CarDetailPage() {
  const { session, car: initialCar } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    car: CarRow
  }

  const isOwner = isFullAdminRole(session.user.role as AppRole)

  const [activeTab, setActiveTab] = useState('overview')
  const [car, setCar] = useState<CarRow>(initialCar)
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<CarFormData>(carToForm(initialCar))
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Lazy tab payloads — loaded on first visit (except open rentals for status badge).
  const [openRentals, setOpenRentals] = useState<
    Awaited<ReturnType<typeof getOpenRentalsByCarId>> | null
  >(null)
  const [rentalHistory, setRentalHistory] = useState<
    Awaited<ReturnType<typeof getRentalsByCarId>> | null
  >(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [events, setEvents] = useState<MaintenanceEventRow[] | null>(null)
  const [config, setConfig] = useState<CarServiceConfigRow | null>(null)
  const [maintLoading, setMaintLoading] = useState(false)
  const [maintLoaded, setMaintLoaded] = useState(false)

  const displayStatus = deriveCarDisplayStatus(
    car.status,
    openRentals ? pickOpenRentalForDisplay(openRentals) : null,
  )

  // Maintenance UI state
  const [newEventOpen, setNewEventOpen] = useState(false)
  const [closeEventOpen, setCloseEventOpen] = useState<string | null>(null) // eventId
  const [configOpen, setConfigOpen] = useState(false)
  const [maintError, setMaintError] = useState<string | null>(null)
  const [maintSubmitting, setMaintSubmitting] = useState(false)

  // New event form
  const [eventType, setEventType] = useState<MaintenanceEventType>('scheduled')
  const [eventDesc, setEventDesc] = useState('')
  const [eventMileage, setEventMileage] = useState('')
  const [eventCost, setEventCost] = useState('0.00')
  const [eventVendor, setEventVendor] = useState('')
  const [eventNextMileage, setEventNextMileage] = useState('')
  const [eventNextDate, setEventNextDate] = useState('')

  // Close event form
  const [closeMileage, setCloseMileage] = useState('')
  const [closeCost, setCloseCost] = useState('0.00')
  const [closeVendor, setCloseVendor] = useState('')
  const [closeNextMileage, setCloseNextMileage] = useState('')
  const [closeNextDate, setCloseNextDate] = useState('')

  // Service config form
  const [cfgIntervalKm, setCfgIntervalKm] = useState('')
  const [cfgIntervalDays, setCfgIntervalDays] = useState('')
  const [cfgAlertKm, setCfgAlertKm] = useState('500')
  const [cfgAlertDays, setCfgAlertDays] = useState('7')
  const [cfgRoadTaxExpiry, setCfgRoadTaxExpiry] = useState('')
  const [cfgRoadTaxCost, setCfgRoadTaxCost] = useState('0')
  const [cfgRoadTaxRef, setCfgRoadTaxRef] = useState('')
  const [cfgInsuranceExpiry, setCfgInsuranceExpiry] = useState('')
  const [cfgInsuranceCost, setCfgInsuranceCost] = useState('0')
  const [cfgInsuranceRef, setCfgInsuranceRef] = useState('')

  function applyServiceConfig(next: CarServiceConfigRow | null) {
    setConfig(next)
    setCfgIntervalKm(String(next?.serviceIntervalKm ?? ''))
    setCfgIntervalDays(String(next?.serviceIntervalDays ?? ''))
    setCfgAlertKm(String(next?.alertBeforeKm ?? '500'))
    setCfgAlertDays(String(next?.alertBeforeDays ?? '7'))
    setCfgRoadTaxExpiry(
      next?.roadTaxExpiryDate
        ? new Date(next.roadTaxExpiryDate).toISOString().split('T')[0]
        : '',
    )
    setCfgRoadTaxCost(String((next?.roadTaxRenewalCostSen ?? 0) / 100))
    setCfgRoadTaxRef(next?.roadTaxPolicyRef ?? '')
    setCfgInsuranceExpiry(
      next?.insuranceExpiryDate
        ? new Date(next.insuranceExpiryDate).toISOString().split('T')[0]
        : '',
    )
    setCfgInsuranceCost(String((next?.insuranceRenewalCostSen ?? 0) / 100))
    setCfgInsuranceRef(next?.insurancePolicyRef ?? '')
  }

  // Reset lazy state when navigating between vehicles.
  useEffect(() => {
    setCar(initialCar)
    setFormData(carToForm(initialCar))
    setActiveTab('overview')
    setOpenRentals(null)
    setRentalHistory(null)
    setHistoryLoading(false)
    setEvents(null)
    setMaintLoading(false)
    setMaintLoaded(false)
    applyServiceConfig(null)
    void getOpenRentalsByCarId({ data: { carId: initialCar.id } })
      .then(setOpenRentals)
      .catch(() => setOpenRentals([]))
  }, [initialCar.id])

  async function loadHistory() {
    if (rentalHistory !== null || historyLoading) return
    setHistoryLoading(true)
    try {
      const rows = await getRentalsByCarId({ data: { carId: car.id } })
      setRentalHistory(rows)
    } catch {
      setRentalHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function loadMaintenance() {
    if (maintLoaded || maintLoading) return
    setMaintLoading(true)
    try {
      const [nextEvents, nextConfig] = await Promise.all([
        getCarMaintenanceEvents({ data: { carId: car.id } }),
        getCarServiceConfig({ data: { carId: car.id } }),
      ])
      setEvents(nextEvents)
      applyServiceConfig(nextConfig)
      setMaintLoaded(true)
    } catch {
      setEvents([])
      applyServiceConfig(null)
      setMaintLoaded(true)
    } finally {
      setMaintLoading(false)
    }
  }

  function handleTabChange(value: string) {
    setActiveTab(value)
    if (value === 'maintenance') void loadMaintenance()
    if (value === 'history') void loadHistory()
  }

  function setField<K extends keyof CarFormData>(key: K, value: CarFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function openEdit() {
    setFormData(carToForm(car))
    setFormError(null)
    setEditOpen(true)
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const updated = await updateCar({
        data: {
          carId: car.id,
          plateNumber: formData.plateNumber,
          make: formData.make,
          model: formData.model,
          year: Number(formData.year),
          color: formData.color,
          category: formData.category,
          dailyRateSen: Math.round(Number(formData.dailyRateRM) * 100),
          notes: formData.notes || undefined,
        },
      })
      setCar(updated as CarRow)
      setEditOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setMaintError(null)
    setMaintSubmitting(true)
    try {
      await createMaintenanceEvent({
        data: {
          carId: car.id,
          type: eventType,
          description: eventDesc,
          mileageAtService: eventMileage ? Number(eventMileage) : null,
          costSen: Math.round(Number(eventCost) * 100),
          workshopVendor: eventVendor || null,
          nextDueMileage: eventNextMileage ? Number(eventNextMileage) : null,
          nextDueDate: eventNextDate || null,
        },
      })
      const [updatedEvents, updatedCar] = await Promise.all([
        getCarMaintenanceEvents({ data: { carId: car.id } }),
        getCarById({ data: { carId: car.id } }),
      ])
      setEvents(updatedEvents)
      if (updatedCar) setCar(updatedCar as CarRow)
      setNewEventOpen(false)
      setEventType('scheduled')
      setEventDesc('')
      setEventMileage('')
      setEventCost('0.00')
      setEventVendor('')
      setEventNextMileage('')
      setEventNextDate('')
    } catch (err) {
      setMaintError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setMaintSubmitting(false)
    }
  }

  async function handleCloseEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!closeEventOpen) return
    setMaintError(null)
    setMaintSubmitting(true)
    try {
      await closeMaintenanceEvent({
        data: {
          eventId: closeEventOpen,
          mileageAtService: closeMileage ? Number(closeMileage) : null,
          costSen: closeCost ? Math.round(Number(closeCost) * 100) : undefined,
          workshopVendor: closeVendor || null,
          nextDueMileage: closeNextMileage ? Number(closeNextMileage) : null,
          nextDueDate: closeNextDate || null,
        },
      })
      const [updatedEvents, updatedCar] = await Promise.all([
        getCarMaintenanceEvents({ data: { carId: car.id } }),
        getCarById({ data: { carId: car.id } }),
      ])
      setEvents(updatedEvents)
      if (updatedCar) setCar(updatedCar as CarRow)
      setCloseEventOpen(null)
      setCloseMileage('')
      setCloseCost('0.00')
      setCloseVendor('')
      setCloseNextMileage('')
      setCloseNextDate('')
    } catch (err) {
      setMaintError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setMaintSubmitting(false)
    }
  }

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault()
    setMaintError(null)
    setMaintSubmitting(true)
    try {
      await upsertCarServiceConfig({
        data: {
          carId: car.id,
          serviceIntervalKm: cfgIntervalKm ? Number(cfgIntervalKm) : null,
          serviceIntervalDays: cfgIntervalDays ? Number(cfgIntervalDays) : null,
          alertBeforeKm: Number(cfgAlertKm) || 500,
          alertBeforeDays: Number(cfgAlertDays) || 7,
          roadTaxExpiryDate: cfgRoadTaxExpiry || null,
          roadTaxRenewalCostSen: Math.round(Number(cfgRoadTaxCost) * 100),
          roadTaxPolicyRef: cfgRoadTaxRef || null,
          insuranceExpiryDate: cfgInsuranceExpiry || null,
          insuranceRenewalCostSen: Math.round(Number(cfgInsuranceCost) * 100),
          insurancePolicyRef: cfgInsuranceRef || null,
        },
      })
      const updatedConfig = await getCarServiceConfig({ data: { carId: car.id } })
      setConfig(updatedConfig)
      setConfigOpen(false)
    } catch (err) {
      setMaintError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setMaintSubmitting(false)
    }
  }

  const openEvents = (events ?? []).filter((e) => e.status === 'open')

  return (
    <AdminSidebarShell user={session.user} pageTitle="Vehicle profile">
      <PageHeader
        variant="detail"
        backLink={{ to: '/admin/cars', label: 'Back' }}
        title={`${car.make} ${car.model}`}
        description={
          <>
            <span className="island-kicker">
              {car.category.toUpperCase()} · {car.year}
            </span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span className="font-mono text-xs font-semibold text-[var(--lagoon-deep)]">
              {car.plateNumber}
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={displayStatus} size="md" />
            <Link
              to="/admin/car-models/$carId"
              params={{ carId: car.id }}
              className="button-secondary inline-flex items-center gap-1.5 text-sm"
            >
              Car model
            </Link>
            {isOwner && car.status !== 'retired' ? (
              <button
                type="button"
                className="button-secondary inline-flex items-center gap-1.5"
                onClick={openEdit}
              >
                <Pencil size={13} />
                Edit
              </button>
            ) : null}
          </div>
        }
      />

      {/* Detail tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <TabsList variant="pill">
          {DETAIL_TABS.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger key={t.value} value={t.value}>
                <Icon size={17} />
                {t.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-3">
          <div className="grid items-start gap-3 lg:grid-cols-2">
            <Card size="sm">
              <CardHeader className="pb-0">
                <CardDescription className="island-kicker">Vehicle details</CardDescription>
                <CardTitle className="sr-only">Vehicle details</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <dl className="flex flex-col gap-1.5">
                  <div className="summary-row summary-row--compact">
                    <dt className="text-sm text-[var(--sea-ink-soft)]">Plate number</dt>
                    <dd className="font-mono text-sm font-semibold text-[var(--sea-ink)]">
                      {car.plateNumber}
                    </dd>
                  </div>

                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Make</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">{car.make}</dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Model</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">{car.model}</dd>
                    </div>
                  </div>

                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Year</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">{car.year}</dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Color</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {COLOR_LABEL[car.color]}
                      </dd>
                    </div>
                  </div>

                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Category</dt>
                      <dd>
                        <span className={`category-pill category-pill--${car.category}`}>
                          {CATEGORY_LABEL[car.category]}
                        </span>
                      </dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Daily rate</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {formatMYR(car.dailyRateSen)}
                      </dd>
                    </div>
                  </div>
                </dl>
                {car.notes && (
                  <div className="mt-3 border-t border-[var(--line)] pt-3">
                    <p className="mb-1 text-sm font-medium text-[var(--sea-ink-soft)]">
                      Notes
                    </p>
                    <p className="text-sm text-[var(--sea-ink)]">{car.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader className="pb-0">
                <CardDescription className="island-kicker">Current status</CardDescription>
                <CardTitle className="sr-only">Current status</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={displayStatus} size="md" />
                  <span className="text-sm text-[var(--sea-ink-soft)]">
                    Last updated {car.updatedAt.toLocaleDateString()}
                  </span>
                </div>
                <hr className="my-3 border-[var(--line)]" />
                <p className="island-kicker mb-1">Current mileage</p>
                <p className="text-xl font-semibold text-[var(--sea-ink)]">
                  {car.currentMileage != null
                    ? `${car.currentMileage.toLocaleString()} km`
                    : '—'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="flex flex-col gap-4">
          {maintLoading || !maintLoaded ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-[var(--sea-ink-soft)]">Loading maintenance…</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardDescription className="island-kicker">Service config</CardDescription>
                    <CardTitle>Vehicle configuration</CardTitle>
                  </div>
                  <button
                    type="button"
                    className="button-secondary inline-flex items-center gap-1.5 text-sm"
                    onClick={() => setConfigOpen(true)}
                  >
                    <Pencil size={13} />
                    {config ? 'Edit config' : 'Set up config'}
                  </button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <ConfigValueField
                      label="Service interval"
                      value={
                        config?.serviceIntervalKm || config?.serviceIntervalDays
                          ? [
                              config.serviceIntervalKm
                                ? `${config.serviceIntervalKm.toLocaleString()} km`
                                : null,
                              config.serviceIntervalDays
                                ? `${config.serviceIntervalDays} days`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' / ')
                          : null
                      }
                      placeholder="e.g. 5,000 km / 180 days"
                    />
                    <ConfigValueField
                      label="Alert before service"
                      value={
                        config
                          ? `${config.alertBeforeKm} km / ${config.alertBeforeDays} days`
                          : null
                      }
                      placeholder="e.g. 500 km / 7 days"
                    />
                    <ConfigValueField
                      label="Current mileage"
                      value={
                        car.currentMileage != null
                          ? `${car.currentMileage.toLocaleString()} km`
                          : null
                      }
                      placeholder="e.g. 18,420 km"
                    />
                    <ConfigValueField
                      label="Road tax"
                      value={
                        config?.roadTaxExpiryDate
                          ? `Expires ${formatDate(config.roadTaxExpiryDate)}`
                          : null
                      }
                      placeholder="e.g. Expires 2 Nov 2026"
                      remark={config?.roadTaxPolicyRef}
                      remarkPlaceholder="e.g. RT-88213"
                    />
                    <ConfigValueField
                      label="Insurance"
                      value={
                        config?.insuranceExpiryDate
                          ? `Expires ${formatDate(config.insuranceExpiryDate)}`
                          : null
                      }
                      placeholder="e.g. Expires 15 Sep 2026"
                      remark={config?.insurancePolicyRef}
                      remarkPlaceholder="e.g. INS-XQ-4471"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardDescription className="island-kicker">Maintenance Events</CardDescription>
                    <CardTitle>
                      {openEvents.length > 0 ? (
                        <span className="text-amber-600">
                          {openEvents.length} open event{openEvents.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span>0 open event</span>
                      )}
                    </CardTitle>
                  </div>
                  <button
                    type="button"
                    className="button-secondary inline-flex items-center gap-1.5 text-sm"
                    onClick={() => setNewEventOpen(true)}
                  >
                    <Plus size={13} />
                    Log event
                  </button>
                </CardHeader>
                <CardContent>
                  {(events ?? []).length === 0 ? (
                    <p className="text-sm text-[var(--sea-ink-soft)]">
                      No maintenance events recorded for this vehicle.
                    </p>
                  ) : (
                    <div className="maint-event-table">
                      <div className="maint-event-table-header">
                        <span>Date</span>
                        <span>Type</span>
                        <span>Description</span>
                        <span>Mileage</span>
                        <span>Cost</span>
                        <span>Status</span>
                        <span></span>
                      </div>
                      {(events ?? []).map((ev) => (
                        <div key={ev.id} className="maint-event-row">
                          <span className="text-xs tabular-nums">{formatDate(ev.openedAt)}</span>
                          <span className="maint-type-badge">
                            {maintenanceEventTypeBadge(ev.type)}
                          </span>
                          <span className="text-sm">
                            {ev.description}
                            {ev.workshopVendor ? ` · ${ev.workshopVendor}` : ''}
                          </span>
                          <span className="text-xs tabular-nums text-[var(--sea-ink-soft)]">
                            {ev.mileageAtService != null
                              ? `${ev.mileageAtService.toLocaleString()} km`
                              : '—'}
                          </span>
                          <span className="text-xs tabular-nums">
                            {ev.costSen > 0 ? formatMYR(ev.costSen) : '—'}
                          </span>
                          <span className={`maint-status-badge maint-status-badge--${ev.status}`}>
                            {ev.status === 'open' ? 'Open' : 'Done'}
                          </span>
                          {ev.status === 'open' ? (
                            <button
                              type="button"
                              className="button-secondary px-2 py-1 text-xs"
                              onClick={() => {
                                setCloseEventOpen(ev.id)
                                setCloseCost(String(ev.costSen / 100))
                                setCloseVendor(ev.workshopVendor ?? '')
                              }}
                            >
                              Close
                            </button>
                          ) : (
                            <span />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardDescription className="island-kicker">Rental history</CardDescription>
              <CardTitle className="sr-only">Rental history</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading || rentalHistory === null ? (
                <p className="text-sm text-[var(--sea-ink-soft)]">Loading rental history…</p>
              ) : rentalHistory.length === 0 ? (
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  No rentals recorded for this vehicle yet.
                </p>
              ) : (
                <div className="maint-event-table">
                  <div className="maint-event-table-header">
                    <span>Customer</span>
                    <span>Dates</span>
                    <span>Total</span>
                    <span>Status</span>
                  </div>
                  {rentalHistory.map((r) => (
                    <div key={r.id} className="maint-event-row">
                      <span className="text-sm">{r.customerFullName ?? '—'}</span>
                      <span className="text-xs text-[var(--sea-ink-soft)]">
                        {formatDate(r.startDate)} → {formatDate(r.endDate)}
                      </span>
                      <span className="text-xs tabular-nums">{formatMYR(r.totalAmountSen)}</span>
                      <StatusBadge status={r.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Edit Sheet (matches fleet list) ── */}
      {isOwner && (
        <Sheet open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false) }}>
          <SheetContent
            side="right"
            className="flex flex-col gap-0 p-0 sm:max-w-[28rem]"
          >
            <SheetHeader className="border-b border-[var(--line)] px-5 pt-5 pb-4">
              <p className="island-kicker mb-1">Edit vehicle</p>
              <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
                {car.make} {car.model}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form id="car-detail-form" className="space-y-3" onSubmit={handleFormSubmit}>
                <div>
                  <label className="field-label" htmlFor="cd-plate">Plate number</label>
                  <input
                    id="cd-plate"
                    type="text"
                    className="field-input uppercase"
                    value={formData.plateNumber}
                    onChange={(e) => setField('plateNumber', e.target.value.toUpperCase())}
                    placeholder="e.g. ABC 1234"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="cd-make">Make</label>
                    <input
                      id="cd-make"
                      type="text"
                      className="field-input"
                      value={formData.make}
                      onChange={(e) => setField('make', e.target.value)}
                      placeholder="e.g. Perodua"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cd-model">Model</label>
                    <input
                      id="cd-model"
                      type="text"
                      className="field-input"
                      value={formData.model}
                      onChange={(e) => setField('model', e.target.value)}
                      placeholder="e.g. Myvi"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="cd-year">Year</label>
                    <input
                      id="cd-year"
                      type="number"
                      className="field-input"
                      value={formData.year}
                      onChange={(e) => setField('year', e.target.value)}
                      min={1960}
                      max={currentYear() + 1}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cd-color">Color</label>
                    <select
                      id="cd-color"
                      className="field-input"
                      value={formData.color}
                      onChange={(e) => setField('color', e.target.value as CarColor)}
                      required
                    >
                      {COLOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="cd-category">Category</label>
                    <select
                      id="cd-category"
                      className="field-input"
                      value={formData.category}
                      onChange={(e) => setField('category', e.target.value as CarCategory)}
                      required
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cd-rate">Daily rate (RM)</label>
                    <input
                      id="cd-rate"
                      type="number"
                      className="field-input"
                      value={formData.dailyRateRM}
                      onChange={(e) => setField('dailyRateRM', e.target.value)}
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label" htmlFor="cd-notes">Notes (optional)</label>
                  <textarea
                    id="cd-notes"
                    className="field-input"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Any additional notes about this vehicle…"
                  />
                </div>

                {formError && <p className="form-error">{formError}</p>}
              </form>
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
              <Button type="submit" form="car-detail-form" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* ── New event Sheet ── */}
      <Sheet open={newEventOpen} onOpenChange={(open) => { if (!open) setNewEventOpen(false) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[30rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-0.5">Log maintenance</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {car.plateNumber} — New event
            </SheetTitle>
          </SheetHeader>
          <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleCreateEvent}>
            <div className="flex-1 space-y-4 px-5 py-4">
              <div>
                <label className="field-label" htmlFor="ne-type">Event type</label>
                <select
                  id="ne-type"
                  className="field-input"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as MaintenanceEventType)}
                >
                  {EVENT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="ne-desc">Description <span className="text-red-500">*</span></label>
                <textarea
                  id="ne-desc"
                  className="field-input"
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Describe the work performed or issue…"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="ne-mileage">Mileage at service (km)</label>
                  <input
                    id="ne-mileage"
                    type="number"
                    className="field-input"
                    value={eventMileage}
                    onChange={(e) => setEventMileage(e.target.value)}
                    min={0}
                    placeholder={car.currentMileage != null ? String(car.currentMileage) : 'optional'}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ne-cost">Cost (RM)</label>
                  <input
                    id="ne-cost"
                    type="number"
                    className="field-input"
                    value={eventCost}
                    onChange={(e) => setEventCost(e.target.value)}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="ne-vendor">Workshop / vendor (optional)</label>
                <input
                  id="ne-vendor"
                  type="text"
                  className="field-input"
                  value={eventVendor}
                  onChange={(e) => setEventVendor(e.target.value)}
                  placeholder="e.g. Ah Kow Workshop"
                />
              </div>
              <hr className="border-[var(--line)]" />
              <p className="text-sm font-medium text-[var(--sea-ink-soft)]">Next service due (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="ne-next-km">Due mileage (km)</label>
                  <input
                    id="ne-next-km"
                    type="number"
                    className="field-input"
                    value={eventNextMileage}
                    onChange={(e) => setEventNextMileage(e.target.value)}
                    min={0}
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ne-next-date">Due date</label>
                  <input
                    id="ne-next-date"
                    type="date"
                    className="field-input"
                    value={eventNextDate}
                    onChange={(e) => setEventNextDate(e.target.value)}
                  />
                </div>
              </div>
              {maintError && <p className="form-error">{maintError}</p>}
            </div>
            <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
              <button type="submit" className="button-primary" disabled={maintSubmitting}>
                {maintSubmitting ? 'Logging…' : 'Log event'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setNewEventOpen(false)}>
                Cancel
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Close event Sheet ── */}
      <Sheet open={!!closeEventOpen} onOpenChange={(open) => { if (!open) setCloseEventOpen(null) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[30rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-0.5">Close event</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Mark as completed
            </SheetTitle>
          </SheetHeader>
          <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleCloseEvent}>
            <div className="flex-1 space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cl-mileage">Mileage at close (km)</label>
                  <input
                    id="cl-mileage"
                    type="number"
                    className="field-input"
                    value={closeMileage}
                    onChange={(e) => setCloseMileage(e.target.value)}
                    min={0}
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cl-cost">Final cost (RM)</label>
                  <input
                    id="cl-cost"
                    type="number"
                    className="field-input"
                    value={closeCost}
                    onChange={(e) => setCloseCost(e.target.value)}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="cl-vendor">Workshop / vendor (optional)</label>
                <input
                  id="cl-vendor"
                  type="text"
                  className="field-input"
                  value={closeVendor}
                  onChange={(e) => setCloseVendor(e.target.value)}
                />
              </div>
              <hr className="border-[var(--line)]" />
              <p className="text-sm font-medium text-[var(--sea-ink-soft)]">Next service due (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cl-next-km">Due mileage (km)</label>
                  <input
                    id="cl-next-km"
                    type="number"
                    className="field-input"
                    value={closeNextMileage}
                    onChange={(e) => setCloseNextMileage(e.target.value)}
                    min={0}
                    placeholder="optional"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cl-next-date">Due date</label>
                  <input
                    id="cl-next-date"
                    type="date"
                    className="field-input"
                    value={closeNextDate}
                    onChange={(e) => setCloseNextDate(e.target.value)}
                  />
                </div>
              </div>
              {maintError && <p className="form-error">{maintError}</p>}
            </div>
            <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
              <button type="submit" className="button-primary" disabled={maintSubmitting}>
                {maintSubmitting ? 'Closing…' : 'Mark completed'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setCloseEventOpen(null)}>
                Cancel
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Service config Sheet ── */}
      <Sheet open={configOpen} onOpenChange={(open) => { if (!open) setConfigOpen(false) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:min-w-md">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-0.5">Service config</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {car.plateNumber} — Service config
            </SheetTitle>
          </SheetHeader>
          <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleSaveConfig}>
            <div className="flex-1 space-y-4 px-5 py-4">
              <p className="text-sm font-medium text-[var(--sea-ink-soft)]">Service intervals</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cfg-int-km">Interval (km)</label>
                  <input
                    id="cfg-int-km"
                    type="number"
                    className="field-input"
                    value={cfgIntervalKm}
                    onChange={(e) => setCfgIntervalKm(e.target.value)}
                    min={0}
                    placeholder="e.g. 5000"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cfg-int-days">Interval (days)</label>
                  <input
                    id="cfg-int-days"
                    type="number"
                    className="field-input"
                    value={cfgIntervalDays}
                    onChange={(e) => setCfgIntervalDays(e.target.value)}
                    min={0}
                    placeholder="e.g. 180"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cfg-alert-km">Alert before (km)</label>
                  <input
                    id="cfg-alert-km"
                    type="number"
                    className="field-input"
                    value={cfgAlertKm}
                    onChange={(e) => setCfgAlertKm(e.target.value)}
                    min={0}
                    placeholder="e.g. 500"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cfg-alert-days">Alert before (days)</label>
                  <input
                    id="cfg-alert-days"
                    type="number"
                    className="field-input"
                    value={cfgAlertDays}
                    onChange={(e) => setCfgAlertDays(e.target.value)}
                    min={0}
                    placeholder="e.g. 7"
                  />
                </div>
              </div>

              <hr className="border-[var(--line)]" />
              <p className="text-sm font-medium text-[var(--sea-ink-soft)]">Road tax</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cfg-rt-expiry">Expiry date</label>
                  <input
                    id="cfg-rt-expiry"
                    type="date"
                    className="field-input"
                    value={cfgRoadTaxExpiry}
                    onChange={(e) => setCfgRoadTaxExpiry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cfg-rt-cost">Renewal cost (RM)</label>
                  <input
                    id="cfg-rt-cost"
                    type="number"
                    className="field-input"
                    value={cfgRoadTaxCost}
                    onChange={(e) => setCfgRoadTaxCost(e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="e.g. 350.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="field-label" htmlFor="cfg-rt-ref">Remark</label>
                  <input
                    id="cfg-rt-ref"
                    type="text"
                    className="field-input"
                    value={cfgRoadTaxRef}
                    onChange={(e) => setCfgRoadTaxRef(e.target.value)}
                    placeholder="e.g. RT-88213"
                  />
                </div>
              </div>

              <hr className="border-[var(--line)]" />
              <p className="text-sm font-medium text-[var(--sea-ink-soft)]">Insurance</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cfg-ins-expiry">Expiry date</label>
                  <input
                    id="cfg-ins-expiry"
                    type="date"
                    className="field-input"
                    value={cfgInsuranceExpiry}
                    onChange={(e) => setCfgInsuranceExpiry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cfg-ins-cost">Renewal cost (RM)</label>
                  <input
                    id="cfg-ins-cost"
                    type="number"
                    className="field-input"
                    value={cfgInsuranceCost}
                    onChange={(e) => setCfgInsuranceCost(e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="e.g. 1200.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="field-label" htmlFor="cfg-ins-ref">Remark</label>
                  <input
                    id="cfg-ins-ref"
                    type="text"
                    className="field-input"
                    value={cfgInsuranceRef}
                    onChange={(e) => setCfgInsuranceRef(e.target.value)}
                    placeholder="e.g. INS-XQ-4471"
                  />
                </div>
              </div>
              {maintError && <p className="form-error">{maintError}</p>}
            </div>
            <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
              <button type="submit" className="button-primary" disabled={maintSubmitting}>
                {maintSubmitting ? 'Saving…' : 'Save config'}
              </button>
              <button type="button" className="button-secondary" onClick={() => setConfigOpen(false)}>
                Cancel
              </button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </AdminSidebarShell>
  )
}
