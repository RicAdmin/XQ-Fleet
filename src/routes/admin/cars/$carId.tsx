import { useState } from 'react'

import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Plus, X } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { isFullAdminRole, type AppRole } from '#/lib/auth-model'
import { CarPhotoManager } from '#/components/cars/CarPhotoManager'
import { StatusBadge } from '#/components/ui/StatusBadge'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { CarCategory, CarColor, CarStatus, MaintenanceEventType } from '#/db/schema'
import { getCarById, getCarPhotos, updateCar } from '#/lib/car-functions'
import type { CarServiceConfigRow, MaintenanceEventRow } from '#/lib/maintenance-functions'
import {
  closeMaintenanceEvent,
  createMaintenanceEvent,
  getCarMaintenanceEvents,
  getCarServiceConfig,
  upsertCarServiceConfig,
} from '#/lib/maintenance-functions'

export const Route = createFileRoute('/admin/cars/$carId')({
  beforeLoad: async ({ params }) => {
    const car = await getCarById({ data: { carId: params.carId } })
    if (!car) throw notFound()
    const [photos, maintenanceEvents, serviceConfig] = await Promise.all([
      getCarPhotos({ data: { carId: params.carId } }),
      getCarMaintenanceEvents({ data: { carId: params.carId } }),
      getCarServiceConfig({ data: { carId: params.carId } }),
    ])
    return { car, photos, maintenanceEvents, serviceConfig }
  },
  component: CarDetailPage,
})

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
  currentMileage: number | null
  notes: string | null
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
  const { session, car: initialCar, photos: initialPhotos, maintenanceEvents: initialEvents, serviceConfig: initialConfig } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    car: CarRow
    photos: import('#/lib/car-functions').CarPhotoRow[]
    maintenanceEvents: MaintenanceEventRow[]
    serviceConfig: CarServiceConfigRow | null
  }

  const isOwner = isFullAdminRole(session.user.role as AppRole)

  const [car, setCar] = useState<CarRow>(initialCar)
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<CarFormData>(carToForm(initialCar))
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Maintenance state
  const [events, setEvents] = useState<MaintenanceEventRow[]>(initialEvents)
  const [config, setConfig] = useState<CarServiceConfigRow | null>(initialConfig)
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
  const [cfgIntervalKm, setCfgIntervalKm] = useState(String(initialConfig?.serviceIntervalKm ?? ''))
  const [cfgIntervalDays, setCfgIntervalDays] = useState(String(initialConfig?.serviceIntervalDays ?? ''))
  const [cfgAlertKm, setCfgAlertKm] = useState(String(initialConfig?.alertBeforeKm ?? '500'))
  const [cfgAlertDays, setCfgAlertDays] = useState(String(initialConfig?.alertBeforeDays ?? '7'))
  const [cfgRoadTaxExpiry, setCfgRoadTaxExpiry] = useState(initialConfig?.roadTaxExpiryDate ? new Date(initialConfig.roadTaxExpiryDate).toISOString().split('T')[0] : '')
  const [cfgRoadTaxCost, setCfgRoadTaxCost] = useState(String((initialConfig?.roadTaxRenewalCostSen ?? 0) / 100))
  const [cfgRoadTaxRef, setCfgRoadTaxRef] = useState(initialConfig?.roadTaxPolicyRef ?? '')
  const [cfgInsuranceExpiry, setCfgInsuranceExpiry] = useState(initialConfig?.insuranceExpiryDate ? new Date(initialConfig.insuranceExpiryDate).toISOString().split('T')[0] : '')
  const [cfgInsuranceCost, setCfgInsuranceCost] = useState(String((initialConfig?.insuranceRenewalCostSen ?? 0) / 100))
  const [cfgInsuranceRef, setCfgInsuranceRef] = useState(initialConfig?.insurancePolicyRef ?? '')

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

  const openEvents = events.filter((e) => e.status === 'open')

  return (
    <AdminSidebarShell user={session.user} pageTitle="Vehicle profile">
      {/* Back link */}
      <div className="mb-5">
        <Link
          to="/admin/cars"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
        >
          <ArrowLeft size={14} />
          Back to fleet
        </Link>
      </div>

      {/* Car header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="island-kicker mb-1">
            {car.category.toUpperCase()} · {car.year}
          </p>
          <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">
            {car.make} {car.model}
          </h2>
          <p className="font-mono mt-1 text-sm font-semibold text-[var(--lagoon-deep)]">
            {car.plateNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={car.status} size="md" />
          {isOwner && car.status !== 'retired' && (
            <button
              type="button"
              className="button-secondary inline-flex items-center gap-1.5"
              onClick={openEdit}
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-3">Vehicle details</p>
          <dl className="space-y-3">
            {[
              { label: 'Plate number', value: car.plateNumber },
              { label: 'Make', value: car.make },
              { label: 'Model', value: car.model },
              { label: 'Year', value: car.year },
              { label: 'Color', value: COLOR_LABEL[car.color] },
              {
                label: 'Category',
                value: (
                  <span className={`category-pill category-pill--${car.category}`}>
                    {CATEGORY_LABEL[car.category]}
                  </span>
                ),
              },
              { label: 'Daily rate', value: formatMYR(car.dailyRateSen) },
            ].map(({ label, value }) => (
              <div key={label} className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">{label}</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">{value}</dd>
              </div>
            ))}
          </dl>
          {car.notes && (
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">Notes</p>
              <p className="text-sm text-[var(--sea-ink)]">{car.notes}</p>
            </div>
          )}
        </article>

        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-3">Current status</p>
          <div className="flex items-center gap-3">
            <StatusBadge status={car.status} size="md" />
            <span className="text-sm text-[var(--sea-ink-soft)]">
              Last updated {car.updatedAt.toLocaleDateString()}
            </span>
          </div>

          <hr className="my-4 border-[var(--line)]" />

          <p className="island-kicker mb-3">Rental history</p>
          <div className="hub-empty-state">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Rental history will appear here once Stage 4 is complete.
            </p>
          </div>
        </article>
      </div>

      {/* Photos */}
      {isOwner && (
        <section className="workspace-panel island-shell mt-4 p-5">
          <CarPhotoManager carId={car.id} initialPhotos={initialPhotos} />
        </section>
      )}

      {/* ── Service & Documents ── */}
      <section className="workspace-panel island-shell mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="island-kicker mb-0.5">Service & Documents</p>
            <h3 className="text-base font-semibold text-[var(--sea-ink)]">Vehicle configuration</h3>
          </div>
          <button
            type="button"
            className="button-secondary inline-flex items-center gap-1.5 text-sm"
            onClick={() => setConfigOpen(true)}
          >
            <Pencil size={13} />
            {config ? 'Edit config' : 'Set up config'}
          </button>
        </div>

        {config ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="maint-config-card">
              <p className="maint-config-label">Service interval</p>
              <p className="maint-config-value">
                {config.serviceIntervalKm ? `${config.serviceIntervalKm.toLocaleString()} km` : '—'}
                {config.serviceIntervalKm && config.serviceIntervalDays ? ' / ' : ''}
                {config.serviceIntervalDays ? `${config.serviceIntervalDays} days` : ''}
              </p>
            </div>
            <div className="maint-config-card">
              <p className="maint-config-label">Alert before service</p>
              <p className="maint-config-value">{config.alertBeforeKm} km / {config.alertBeforeDays} days</p>
            </div>
            <div className="maint-config-card">
              <p className="maint-config-label">Current mileage</p>
              <p className="maint-config-value">{car.currentMileage != null ? `${car.currentMileage.toLocaleString()} km` : '—'}</p>
            </div>
            <div className="maint-config-card">
              <p className="maint-config-label">Road tax expiry</p>
              <p className="maint-config-value">{formatDate(config.roadTaxExpiryDate)}</p>
              {config.roadTaxPolicyRef && <p className="maint-config-ref">{config.roadTaxPolicyRef}</p>}
            </div>
            <div className="maint-config-card">
              <p className="maint-config-label">Insurance expiry</p>
              <p className="maint-config-value">{formatDate(config.insuranceExpiryDate)}</p>
              {config.insurancePolicyRef && <p className="maint-config-ref">{config.insurancePolicyRef}</p>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--sea-ink-soft)]">No service configuration set. Click "Set up config" to add service intervals and document expiry dates.</p>
        )}
      </section>

      {/* ── Maintenance events ── */}
      <section className="workspace-panel island-shell mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="island-kicker mb-0.5">Maintenance Events</p>
            <h3 className="text-base font-semibold text-[var(--sea-ink)]">
              {openEvents.length > 0 ? (
                <span className="text-amber-600">{openEvents.length} open event{openEvents.length !== 1 ? 's' : ''}</span>
              ) : (
                <span>No open events</span>
              )}
            </h3>
          </div>
          <button
            type="button"
            className="button-secondary inline-flex items-center gap-1.5 text-sm"
            onClick={() => setNewEventOpen(true)}
          >
            <Plus size={13} />
            Log event
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">No maintenance events recorded for this vehicle.</p>
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
            {events.map((ev) => (
              <div key={ev.id} className="maint-event-row">
                <span className="text-xs tabular-nums">{formatDate(ev.openedAt)}</span>
                <span className="maint-type-badge maint-type-badge--{ev.type}">{maintenanceEventTypeBadge(ev.type)}</span>
                <span className="text-sm">{ev.description}{ev.workshopVendor ? ` · ${ev.workshopVendor}` : ''}</span>
                <span className="text-xs tabular-nums text-[var(--sea-ink-soft)]">
                  {ev.mileageAtService != null ? `${ev.mileageAtService.toLocaleString()} km` : '—'}
                </span>
                <span className="text-xs tabular-nums">
                  {ev.costSen > 0 ? formatMYR(ev.costSen) : '—'}
                </span>
                <span className={`maint-status-badge maint-status-badge--${ev.status}`}>
                  {ev.status === 'open' ? 'Open' : 'Done'}
                </span>
                {ev.status === 'open' && (
                  <button
                    type="button"
                    className="button-secondary text-xs py-1 px-2"
                    onClick={() => {
                      setCloseEventOpen(ev.id)
                      setCloseCost(String(ev.costSen / 100))
                      setCloseVendor(ev.workshopVendor ?? '')
                    }}
                  >
                    Close
                  </button>
                )}
                {ev.status === 'completed' && <span />}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Edit form overlay ── */}
      {isOwner && editOpen && (
        <div className="form-overlay" role="dialog" aria-modal="true">
          <div className="form-panel island-shell">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="island-kicker mb-1">Edit vehicle</p>
                <h3 className="text-xl font-semibold text-[var(--sea-ink)]">
                  {car.make} {car.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(26,25,22,0.06)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div>
                <label className="field-label" htmlFor="cd-plate">Plate number</label>
                <input
                  id="cd-plate"
                  type="text"
                  className="field-input uppercase"
                  value={formData.plateNumber}
                  onChange={(e) => setField('plateNumber', e.target.value.toUpperCase())}
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

              <div className="flex gap-3 pt-2">
                <button type="submit" className="button-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Next service due (optional)</p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Next service due (optional)</p>
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
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[30rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-0.5">Service config</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {car.plateNumber} — Service & Documents
            </SheetTitle>
          </SheetHeader>
          <form className="flex flex-1 flex-col overflow-y-auto" onSubmit={handleSaveConfig}>
            <div className="flex-1 space-y-4 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Service intervals</p>
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
                <div>
                  <label className="field-label" htmlFor="cfg-alert-km">Alert before (km)</label>
                  <input
                    id="cfg-alert-km"
                    type="number"
                    className="field-input"
                    value={cfgAlertKm}
                    onChange={(e) => setCfgAlertKm(e.target.value)}
                    min={0}
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
                  />
                </div>
              </div>

              <hr className="border-[var(--line)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Road tax</p>
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
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="cfg-rt-ref">Policy / reference</label>
                <input
                  id="cfg-rt-ref"
                  type="text"
                  className="field-input"
                  value={cfgRoadTaxRef}
                  onChange={(e) => setCfgRoadTaxRef(e.target.value)}
                  placeholder="optional"
                />
              </div>

              <hr className="border-[var(--line)]" />
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">Insurance</p>
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
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="cfg-ins-ref">Policy / reference</label>
                <input
                  id="cfg-ins-ref"
                  type="text"
                  className="field-input"
                  value={cfgInsuranceRef}
                  onChange={(e) => setCfgInsuranceRef(e.target.value)}
                  placeholder="optional"
                />
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
