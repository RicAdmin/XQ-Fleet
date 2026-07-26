import { useEffect, useRef, useState } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Pencil, CarFront, ImageOff } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import {
  AdminListFilterBar,
  AdminQuickFilterChips,
} from '#/components/ui/AdminListFilterBar'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu } from '#/components/ui/RowActionsMenu'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '#/components/ui/sheet'
import type { CarCategory, CarColor } from '#/db/schema'
import { isFullAdminRole, type AppRole } from '#/lib/auth-model'
import type { CarDisplayStatus } from '#/lib/car-display-status'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import {
  createCar,
  listCars,
  retireCar,
  updateCar,
  type CarListResult,
  type CarListRow,
} from '#/lib/car-functions'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

export const Route = createFileRoute('/admin/cars/')({
  beforeLoad: async ({ cause }) => {
    if (cause === 'preload') return
    const initialResult = await listCars({
      data: {
        page: 1,
        pageSize: PAGE_SIZE,
        sortKey: 'plateNumber',
        sortDir: 'asc',
      },
    })
    return { initialResult }
  },
  component: CarsPage,
})

// ─── Constants ────────────────────────────────────────────────────────────────

const CAR_STATUS_OPTIONS: { value: CarDisplayStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'payment-pending', label: 'Awaiting pay' },
  { value: 'rented', label: 'Rented' },
  { value: 'overdue', label: 'Overdue' },
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
  white: '#f0f0f0',
  black: '#1a1a1a',
  silver: '#c8c8c8',
  grey: '#808080',
  red: '#cc2222',
  blue: '#2244cc',
  'dark-blue': '#1a2a6c',
  maroon: '#800000',
  gold: '#c8a600',
  beige: '#d4b896',
  green: '#2d6a2d',
  other: '#999999',
}

const CATEGORY_LABEL: Record<CarCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarCategory, string>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentYear() {
  return new Date().getFullYear()
}

// ─── Car row type (from server) ───────────────────────────────────────────────

type CarRow = CarListRow

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
  ownedByFleet: boolean
  availableForBooking: boolean
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
    ownedByFleet: true,
    availableForBooking: true,
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
    ownedByFleet: car.ownedByFleet,
    availableForBooking: car.availableForBooking,
  }
}

type SortKey = 'plateNumber' | 'make' | 'year' | 'status' | 'category' | 'dailyRateSen' | 'createdAt'

function CarsPage() {
  const navigate = useNavigate()
  const { session, initialResult } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialResult: CarListResult
  }

  const isOwner = isFullAdminRole(session.user.role as AppRole)
  const skipInitialLoad = useRef(Boolean(initialResult))

  const [result, setResult] = useState<CarListResult | null>(initialResult ?? null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<CarDisplayStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<CarCategoryFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
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

  async function load(p = page) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listCars({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: activeTab === 'all' ? undefined : activeTab,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          search: search || undefined,
          sortKey,
          sortDir,
        },
      })
      setResult(res)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load vehicles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    setPage(1)
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, categoryFilter, search, sortKey, sortDir])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => (prev === next ? prev : next))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const tabCounts = result?.statusCounts ?? { all: 0 }
  const activeFilterCount = categoryFilter !== 'all' ? 1 : 0
  const hasActiveFilters =
    activeTab !== 'all' ||
    categoryFilter !== 'all' ||
    searchInput.trim().length > 0 ||
    search.length > 0

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
        await updateCar({
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
            ownedByFleet: formData.ownedByFleet,
            availableForBooking: formData.availableForBooking,
          },
        })
        await load(page)
      } else {
        await createCar({
          data: {
            plateNumber: formData.plateNumber,
            make: formData.make,
            model: formData.model,
            year,
            color: formData.color,
            category: formData.category,
            dailyRateSen,
            notes: formData.notes || undefined,
            ownedByFleet: formData.ownedByFleet,
            availableForBooking: formData.availableForBooking,
          },
        })
        setPage(1)
        await load(1)
      }
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Retire handler ────────────────────────────────────────────────────────

  async function handleRetireConfirm() {
    if (!confirmingRetire) return
    setRetireError(null)
    setIsRetiring(true)
    try {
      await retireCar({ data: { carId: confirmingRetire.id } })
      await load(page)
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
      header: 'Vehicle',
      sortable: true,
      headerClassName: 'cars-table__col-vehicle',
      cellClassName: 'cars-table__col-vehicle',
      render: (car) => (
        <div className="fleet-vehicle-cell">
          <div className="fleet-vehicle-cell__media" aria-hidden>
            {car.coverPhotoUrl ? (
              <img src={car.coverPhotoUrl} alt="" className="fleet-vehicle-cell__img" />
            ) : (
              <span className="fleet-vehicle-cell__placeholder">
                <ImageOff size={20} strokeWidth={1.75} />
              </span>
            )}
          </div>
          <div className="fleet-vehicle-cell__body">
            <Link
              to="/admin/cars/$carId"
              params={{ carId: car.id }}
              className="fleet-vehicle-cell__name font-mono"
              onClick={(e) => e.stopPropagation()}
            >
              {car.plateNumber}
            </Link>
            <p className="fleet-vehicle-cell__meta">
              <span
                className="fleet-vehicle-cell__swatch"
                style={{ background: COLOR_SWATCH[car.color] }}
              />
              {COLOR_LABEL[car.color]} · {car.year}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'make',
      header: 'Model',
      sortable: true,
      render: (car) => (
        <Link
          to="/admin/car-models/$carId"
          params={{ carId: car.id }}
          className="text-sm font-medium text-[var(--sea-ink)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {car.make} {car.model}
        </Link>
      ),
    },
    {
      key: 'category',
      header: 'Type',
      sortable: true,
      headerClassName: 'cars-table__col-type',
      cellClassName: 'cars-table__col-type',
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
      render: (car) => <StatusBadge status={car.displayStatus} size="sm" />,
    },
    ...(isOwner
      ? [
          {
            key: 'actions',
            header: '',
            headerClassName: 'text-right w-[1%]',
            cellClassName: 'text-right whitespace-nowrap',
            render: (car: CarRow) => (
              <RowActionsMenu
                label={`Actions for ${car.plateNumber}`}
                actions={[
                  {
                    label: 'Open vehicle',
                    onSelect: () =>
                      void navigate({
                        to: '/admin/cars/$carId',
                        params: { carId: car.id },
                      }),
                  },
                  {
                    label: 'Open car model',
                    onSelect: () =>
                      void navigate({
                        to: '/admin/car-models/$carId',
                        params: { carId: car.id },
                      }),
                  },
                  {
                    label: 'Edit basics',
                    icon: <Pencil />,
                    disabled: car.status === 'retired',
                    onSelect: () => openEdit(car),
                  },
                  ...(car.status !== 'retired'
                    ? [
                        {
                          label: 'Retire',
                          variant: 'destructive' as const,
                          separatorBefore: true,
                          onSelect: () => setConfirmingRetire(car),
                        },
                      ]
                    : []),
                ]}
              />
            ),
          } satisfies Column<CarRow>,
        ]
      : []),
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Vehicles">
      <PageHeader
        kicker="Fleet"
        title="Vehicles"
        description={
          result
            ? `${result.total.toLocaleString()} plates in inventory`
            : 'Loading…'
        }
      />

      {loadError ? (
        <ErrorPanel title="Failed to load vehicles" message={loadError} onRetry={() => load()} />
      ) : null}

      {loading && !result ? <TableSkeleton rows={8} columns={5} /> : null}

      {result ? (
        <div className="space-y-3">
          <article className="workspace-panel island-shell overflow-x-auto p-0">
            <AdminListFilterBar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchClear={() => setSearch('')}
              searchPlaceholder="Search plate, make, model…"
              searchAriaLabel="Search vehicles"
              resultSummary={`${result.total} vehicle${result.total !== 1 ? 's' : ''}`}
              filtersOpen={filtersOpen}
              onFiltersOpenChange={setFiltersOpen}
              activeFilterCount={activeFilterCount}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                setActiveTab('all')
                setCategoryFilter('all')
                setSearchInput('')
                setSearch('')
              }}
              actions={
                isOwner ? (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    onClick={openAdd}
                  >
                    <Plus size={15} />
                    Add vehicle
                  </Button>
                ) : null
              }
              quickFilters={
                <AdminQuickFilterChips
                  label="Status"
                  value={activeTab}
                  options={CAR_STATUS_OPTIONS.map((tab) => {
                    const count =
                      tab.value === 'all' ? (tabCounts.all ?? 0) : tabCounts[tab.value]
                    return {
                      value: tab.value,
                      label:
                        tab.value === 'all' || typeof count !== 'number'
                          ? tab.label
                          : `${tab.label} (${count})`,
                    }
                  })}
                  onValueChange={(value) =>
                    setActiveTab(value as CarDisplayStatus | 'all')
                  }
                />
              }
            >
              <StatusFilterSelect
                aria-label="Filter vehicles by type"
                value={categoryFilter}
                options={CAR_CATEGORY_FILTER_OPTIONS}
                onValueChange={setCategoryFilter}
              />
            </AdminListFilterBar>

            <DataTable
              className="cars-table--fleet"
              columns={columns}
              data={result.rows}
              getKey={(c) => c.id}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort as (key: string) => void}
              onRowClick={(car) =>
                void navigate({ to: '/admin/cars/$carId', params: { carId: car.id } })
              }
              emptyState={
                <div className="hub-empty-state m-6">
                  <CarFront size={28} className="text-[var(--sea-ink-soft)]" />
                  <p className="text-sm text-[var(--sea-ink-soft)]">
                    {hasActiveFilters
                      ? 'No vehicles match these filters.'
                      : 'No vehicles yet. Add your first fleet vehicle.'}
                  </p>
                  {isOwner && !hasActiveFilters ? (
                    <Button type="button" size="sm" className="mt-3 gap-1.5" onClick={openAdd}>
                      <Plus size={14} />
                      Add vehicle
                    </Button>
                  ) : null}
                </div>
              }
            />
          </article>
          <div className="admin-pagination">
            <span>
              Page {result.page} of {totalPages} · {result.total.toLocaleString()} total
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button-secondary"
                disabled={result.page <= 1 || loading}
                onClick={() => {
                  setPage(result.page - 1)
                  void load(result.page - 1)
                }}
              >
                Previous
              </button>
              <button
                type="button"
                className="button-secondary"
                disabled={result.page >= totalPages || loading}
                onClick={() => {
                  setPage(result.page + 1)
                  void load(result.page + 1)
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Add / Edit Sheet ── */}
      {isOwner && (
        <Sheet open={formOpen} onOpenChange={(open) => { if (!open) closeForm() }}>
          <SheetContent
            side="right"
            className="flex flex-col gap-0 p-0 sm:max-w-[30rem]"
          >
            <SheetHeader className="border-b border-[var(--line)] px-5 pt-5 pb-4">
              <p className="island-kicker mb-1">
                {editingCar ? 'Edit basics' : 'New vehicle'}
              </p>
              <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
                {editingCar
                  ? `${editingCar.make} ${editingCar.model}`
                  : 'Add to fleet'}
              </SheetTitle>
              <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                {editingCar
                  ? 'Plate, category, and rate. Website photos & pricing live on the vehicle page.'
                  : 'Create the fleet record first, then open it to add photos and website details.'}
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form
                id="car-form"
                className="admin-form-sheet fleet-car-form space-y-5"
                onSubmit={handleFormSubmit}
              >
                <section className="fleet-car-form__section">
                  <span className="ui-label">Identity</span>
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="field-label" htmlFor="cf-plate">
                        Plate number
                      </label>
                      <input
                        id="cf-plate"
                        type="text"
                        className="field-input uppercase"
                        value={formData.plateNumber}
                        onChange={(e) =>
                          setField('plateNumber', e.target.value.toUpperCase())
                        }
                        placeholder="e.g. ABC 1234"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label" htmlFor="cf-make">
                          Make
                        </label>
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
                        <label className="field-label" htmlFor="cf-model">
                          Model
                        </label>
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
                        <label className="field-label" htmlFor="cf-year">
                          Year
                        </label>
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
                        <label className="field-label" htmlFor="cf-color">
                          Color
                        </label>
                        <select
                          id="cf-color"
                          className="field-input"
                          value={formData.color}
                          onChange={(e) =>
                            setField('color', e.target.value as CarColor)
                          }
                          required
                        >
                          {COLOR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="fleet-car-form__section">
                  <span className="ui-label">Commercial</span>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label" htmlFor="cf-category">
                        Category
                      </label>
                      <select
                        id="cf-category"
                        className="field-input"
                        value={formData.category}
                        onChange={(e) =>
                          setField('category', e.target.value as CarCategory)
                        }
                        required
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label" htmlFor="cf-rate">
                        Daily rate (RM)
                      </label>
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
                </section>

                <section className="fleet-car-form__section">
                  <span className="ui-label">Listing</span>
                  <div className="mt-2 flex flex-col gap-2.5">
                    <label className="flex items-start gap-2.5 text-sm leading-snug">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={formData.ownedByFleet}
                        onChange={(e) => setField('ownedByFleet', e.target.checked)}
                      />
                      <span>
                        <span className="font-medium text-[var(--sea-ink)]">
                          Owned by fleet
                        </span>
                        <span className="block text-[var(--sea-ink-soft)]">
                          Priority stock for bookings
                        </span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm leading-snug">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={formData.availableForBooking}
                        onChange={(e) =>
                          setField('availableForBooking', e.target.checked)
                        }
                      />
                      <span>
                        <span className="font-medium text-[var(--sea-ink)]">
                          Available for booking
                        </span>
                        <span className="block text-[var(--sea-ink-soft)]">
                          Show on the public website
                        </span>
                      </span>
                    </label>
                  </div>
                </section>

                <section className="fleet-car-form__section">
                  <label className="field-label" htmlFor="cf-notes">
                    Notes <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                  </label>
                  <textarea
                    id="cf-notes"
                    className="field-input mt-1.5"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setField('notes', e.target.value)}
                    placeholder="Internal notes about this vehicle…"
                  />
                </section>

                {formError ? <p className="form-error">{formError}</p> : null}
              </form>
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
              <Button type="submit" form="car-form" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving…'
                  : editingCar
                    ? 'Save changes'
                    : 'Add vehicle'}
              </Button>
              <Button variant="outline" type="button" onClick={closeForm}>
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Confirm retire ── */}
      <ConfirmActionDialog
        open={isOwner && confirmingRetire != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingRetire(null)
            setRetireError(null)
          }
        }}
        title={
          confirmingRetire
            ? `Retire ${confirmingRetire.plateNumber}?`
            : 'Retire vehicle?'
        }
        description={
          confirmingRetire ? (
            <>
              This will mark{' '}
              <strong>
                {confirmingRetire.make} {confirmingRetire.model}
              </strong>{' '}
              as retired. The vehicle will no longer appear in active inventory
              but its record is preserved.
              {retireError ? (
                <span className="mt-2 block text-[var(--error)]">{retireError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Confirm retire"
        confirming={isRetiring}
        onConfirm={handleRetireConfirm}
      />
    </AdminSidebarShell>
  )
}
