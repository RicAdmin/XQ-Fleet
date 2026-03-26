import { useState, useMemo } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { ChevronDown, Plus, Pencil, CarFront } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { PageHeader } from '#/components/ui/PageHeader'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '#/components/ui/sheet'
import { StatusBadge } from '#/components/ui/StatusBadge'
import type { CarCategory, CarColor, CarStatus } from '#/db/schema'
import {
  createCar,
  getCars,
  retireCar,
  updateCar,
  updateCarStatus,
} from '#/lib/car-functions'

export const Route = createFileRoute('/admin/cars/')({
  beforeLoad: async () => {
    const cars = await getCars()
    return { cars }
  },
  component: CarsPage,
})

// ─── Constants ────────────────────────────────────────────────────────────────

const CAR_STATUS_TABS: { value: CarStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'payment-pending', label: 'Awaiting payment' },
  { value: 'rented', label: 'Rented' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'retired', label: 'Retired' },
]

const CATEGORY_OPTIONS: { value: CarCategory; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'mpv', label: 'MPV' },
  { value: 'suv', label: 'SUV' },
  { value: 'other', label: 'Other' },
]

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

const COLOR_LABEL: Record<CarColor, string> = Object.fromEntries(
  COLOR_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarColor, string>

const COLOR_SWATCH: Record<CarColor, string> = {
  white:       '#f0f0f0',
  black:       '#1a1a1a',
  silver:      '#c8c8c8',
  grey:        '#808080',
  red:         '#cc2222',
  blue:        '#2244cc',
  'dark-blue': '#1a2a6c',
  maroon:      '#800000',
  gold:        '#c8a600',
  beige:       '#d4b896',
  green:       '#2d6a2d',
  other:       '#999999',
}

const CATEGORY_LABEL: Record<CarCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarCategory, string>

const MANUAL_STATUS_OPTIONS: { value: 'maintenance' | 'damaged' | 'available'; label: string }[] =
  [
    { value: 'available', label: 'Available' },
    { value: 'maintenance', label: 'Under maintenance' },
    { value: 'damaged', label: 'Damaged' },
  ]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function currentYear() {
  return new Date().getFullYear()
}

// ─── Car row type (from DB) ───────────────────────────────────────────────────

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
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Form state ───────────────────────────────────────────────────────────────

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

function emptyForm(): CarFormData {
  return {
    plateNumber: '',
    make: '',
    model: '',
    year: String(currentYear()),
    color: 'white',
    category: 'economy',
    dailyRateRM: '',
    notes: '',
  }
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

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey = 'plateNumber' | 'make' | 'year' | 'status' | 'category' | 'dailyRateSen'

function sortCars(cars: CarRow[], key: SortKey, dir: 'asc' | 'desc'): CarRow[] {
  return [...cars].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return dir === 'asc' ? cmp : -cmp
  })
}

// ─── Row action button (compact, for use inside table rows) ──────────────────

const ROW_BTN =
  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] shadow-[0_1px_3px_rgba(30,90,72,0.08)] hover:-translate-y-px transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

// ─── Component ────────────────────────────────────────────────────────────────

function CarsPage() {
  const { session, cars: initialCars } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    cars: CarRow[]
  }

  const isOwner = session.user.role === 'owner'

  const [cars, setCars] = useState<CarRow[]>(initialCars)
  const [activeTab, setActiveTab] = useState<CarStatus | 'all'>('all')
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>('plateNumber')

  // Form panel
  const [formOpen, setFormOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<CarRow | null>(null)
  const [formData, setFormData] = useState<CarFormData>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirm retire
  const [confirmingRetire, setConfirmingRetire] = useState<CarRow | null>(null)
  const [retireError, setRetireError] = useState<string | null>(null)
  const [isRetiring, setIsRetiring] = useState(false)

  // Status change
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  // ── Derived data ──────────────────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cars.length }
    for (const car of cars) {
      counts[car.status] = (counts[car.status] ?? 0) + 1
    }
    return counts
  }, [cars])

  const filteredSortedCars = useMemo(() => {
    const filtered = activeTab === 'all' ? cars : cars.filter((c) => c.status === activeTab)
    return sortCars(filtered, sortKey, sortDir)
  }, [cars, activeTab, sortKey, sortDir])

  // ── Form handlers ─────────────────────────────────────────────────────────

  function openAdd() {
    setEditingCar(null)
    setFormData(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(car: CarRow) {
    setEditingCar(car)
    setFormData(carToForm(car))
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingCar(null)
    setFormError(null)
  }

  function setField<K extends keyof CarFormData>(key: K, value: CarFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)

    const dailyRateSen = Math.round(Number(formData.dailyRateRM) * 100)
    const year = Number(formData.year)

    try {
      if (editingCar) {
        const updated = await updateCar({
          data: {
            carId: editingCar.id,
            plateNumber: formData.plateNumber,
            make: formData.make,
            model: formData.model,
            year,
            color: formData.color,
            category: formData.category,
            dailyRateSen,
            notes: formData.notes || undefined,
          },
        })
        setCars((prev) => prev.map((c) => (c.id === updated.id ? (updated as CarRow) : c)))
      } else {
        const created = await createCar({
          data: {
            plateNumber: formData.plateNumber,
            make: formData.make,
            model: formData.model,
            year,
            color: formData.color,
            category: formData.category,
            dailyRateSen,
            notes: formData.notes || undefined,
          },
        })
        setCars((prev) => [created as CarRow, ...prev])
      }
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Status change handler ─────────────────────────────────────────────────

  async function handleStatusChange(carId: string, status: 'maintenance' | 'damaged' | 'available') {
    setStatusChangingId(carId)
    setStatusError(null)
    try {
      const updated = await updateCarStatus({ data: { carId, status } })
      setCars((prev) => prev.map((c) => (c.id === updated.id ? (updated as CarRow) : c)))
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Status update failed.')
    } finally {
      setStatusChangingId(null)
    }
  }

  // ── Retire handler ────────────────────────────────────────────────────────

  async function handleRetireConfirm() {
    if (!confirmingRetire) return
    setRetireError(null)
    setIsRetiring(true)
    try {
      const updated = await retireCar({ data: { carId: confirmingRetire.id } })
      setCars((prev) => prev.map((c) => (c.id === updated.id ? (updated as CarRow) : c)))
      setConfirmingRetire(null)
    } catch (err) {
      setRetireError(err instanceof Error ? err.message : 'Unable to retire vehicle.')
    } finally {
      setIsRetiring(false)
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<CarRow>[] = [
    {
      key: 'plateNumber',
      header: 'Plate',
      sortable: true,
      render: (car) => (
        <Link to="/admin/cars/$carId" params={{ carId: car.id }} className="plate-link">
          {car.plateNumber}
        </Link>
      ),
    },
    {
      key: 'make',
      header: 'Vehicle',
      sortable: true,
      render: (car) => (
        <>
          <span className="font-medium">{car.make}</span>{' '}
          <span className="vehicle-model">{car.model}</span>
        </>
      ),
    },
    {
      key: 'year',
      header: 'Year',
      sortable: true,
      cellClassName: 'text-[var(--sea-ink-soft)]',
      render: (car) => car.year,
    },
    {
      key: 'color',
      header: 'Color',
      render: (car) => (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-full border border-black/10" style={{ background: COLOR_SWATCH[car.color] }} />
          <span className="text-[var(--sea-ink-soft)]">{COLOR_LABEL[car.color]}</span>
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (car) => (
        <span className={`category-pill category-pill--${car.category}`}>
          {CATEGORY_LABEL[car.category]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (car) =>
        isOwner &&
        car.status !== 'retired' &&
        car.status !== 'rented' &&
        car.status !== 'reserved' &&
        car.status !== 'payment-pending' ? (
          <span className="relative inline-flex items-center">
            <select
              className={`status-badge status-badge--${car.status} cursor-pointer appearance-none border-0 pr-[1.1rem] transition-shadow hover:ring-1 hover:ring-current/30 disabled:cursor-not-allowed disabled:opacity-60`}
              value={car.status}
              disabled={statusChangingId === car.id}
              onChange={(e) =>
                handleStatusChange(car.id, e.target.value as 'maintenance' | 'damaged' | 'available')
              }
              aria-label={`Change status of ${car.plateNumber}`}
              title="Click to change status"
            >
              {MANUAL_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={9} className="pointer-events-none absolute right-[0.3rem] opacity-60" strokeWidth={2.5} />
          </span>
        ) : (
          <StatusBadge status={car.status} />
        ),
    },
    {
      key: 'dailyRateSen',
      header: 'Daily Rate',
      sortable: true,
      render: (car) => formatMYR(car.dailyRateSen),
    },
    ...(isOwner
      ? [
          {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'text-right',
            cellClassName: 'text-right whitespace-nowrap',
            render: (car: CarRow) => (
              <>
                <button
                  type="button"
                  className={`${ROW_BTN} mr-1.5`}
                  onClick={() => openEdit(car)}
                  disabled={car.status === 'retired'}
                  title={car.status === 'retired' ? 'Retired vehicles cannot be edited' : 'Edit vehicle'}
                >
                  <Pencil size={11} />
                  Edit
                </button>
                {car.status !== 'retired' && (
                  <button
                    type="button"
                    className={`${ROW_BTN} opacity-60 hover:opacity-100`}
                    onClick={() => setConfirmingRetire(car)}
                  >
                    Retire
                  </button>
                )}
              </>
            ),
          } satisfies Column<CarRow>,
        ]
      : []),
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Fleet">
      {/* Page header */}
      <PageHeader
        title="Vehicle Inventory"
        description={`${cars.length} vehicle${cars.length !== 1 ? 's' : ''} total`}
        actions={
          isOwner && (
            <button type="button" className="button-primary flex items-center gap-2" onClick={openAdd}>
              <Plus size={15} />
              Add vehicle
            </button>
          )
        }
      />

      {/* Status tabs */}
      <div className="status-tabs mb-4">
        {CAR_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`status-tab ${activeTab === tab.value ? 'is-active' : ''}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
            {tabCounts[tab.value] != null && (
              <span className="tab-count">{tabCounts[tab.value]}</span>
            )}
          </button>
        ))}
      </div>

      {statusError && (
        <p className="form-error mb-3">{statusError}</p>
      )}

      {/* Table */}
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <DataTable
          columns={columns}
          data={filteredSortedCars}
          getKey={(c) => c.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort as (key: string) => void}
          emptyState={
            <div className="hub-empty-state m-6">
              <CarFront size={28} className="text-[var(--sea-ink-soft)]" />
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {activeTab === 'all' ? 'No vehicles yet.' : `No ${activeTab} vehicles.`}
              </p>
            </div>
          }
        />
      </article>

      {/* ── Add / Edit Sheet ── */}
      {isOwner && (
        <Sheet open={formOpen} onOpenChange={(open) => { if (!open) closeForm() }}>
          <SheetContent
            side="right"
            className="flex flex-col gap-0 p-0 sm:max-w-[28rem]"
          >
            <SheetHeader className="border-b border-[var(--line)] px-5 pt-5 pb-4">
              <p className="island-kicker mb-1">
                {editingCar ? 'Edit vehicle' : 'New vehicle'}
              </p>
              <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
                {editingCar ? `${editingCar.make} ${editingCar.model}` : 'Add to fleet'}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form id="car-form" className="space-y-3" onSubmit={handleFormSubmit}>
                <div>
                  <label className="field-label" htmlFor="cf-plate">Plate number</label>
                  <input
                    id="cf-plate"
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
                    <label className="field-label" htmlFor="cf-make">Make</label>
                    <input
                      id="cf-make"
                      type="text"
                      className="field-input"
                      value={formData.make}
                      onChange={(e) => setField('make', e.target.value)}
                      placeholder="e.g. Perodua"
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="cf-model">Model</label>
                    <input
                      id="cf-model"
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
                    <label className="field-label" htmlFor="cf-year">Year</label>
                    <input
                      id="cf-year"
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
                    <label className="field-label" htmlFor="cf-color">Color</label>
                    <select
                      id="cf-color"
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
                    <label className="field-label" htmlFor="cf-category">Category</label>
                    <select
                      id="cf-category"
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
                    <label className="field-label" htmlFor="cf-rate">Daily rate (RM)</label>
                    <input
                      id="cf-rate"
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
                  <label className="field-label" htmlFor="cf-notes">Notes (optional)</label>
                  <textarea
                    id="cf-notes"
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
              <Button type="submit" form="car-form" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : editingCar ? 'Save changes' : 'Add vehicle'}
              </Button>
              <Button variant="outline" type="button" onClick={closeForm}>
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Confirm retire overlay ── */}
      {isOwner && confirmingRetire && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog island-shell">
            <p className="island-kicker mb-2">Retire vehicle</p>
            <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              Retire {confirmingRetire.plateNumber}?
            </h3>
            <p className="mb-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
              This will mark{' '}
              <strong>
                {confirmingRetire.make} {confirmingRetire.model}
              </strong>{' '}
              as retired. The vehicle will no longer appear in active inventory but its record is preserved.
            </p>
            {retireError && <p className="form-error mb-4">{retireError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                className="button-primary"
                onClick={handleRetireConfirm}
                disabled={isRetiring}
              >
                {isRetiring ? 'Retiring…' : 'Confirm retire'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setConfirmingRetire(null)
                  setRetireError(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSidebarShell>
  )
}
