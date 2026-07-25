import { useEffect, useMemo, useState } from 'react'

import { useNavigate } from '@tanstack/react-router'
import { KeyRound, Plus, Trash2, X } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu, type RowActionItem } from '#/components/ui/RowActionsMenu'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { CustomerRow } from '#/components/customers/CustomersList'
import type { AvailableCarOption, RentalListResult, RentalListRow } from '#/lib/rental-functions'
import { cancelRental, confirmHandover, createRental, deleteRental, listRentals } from '#/lib/rental-functions'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import type { RentalStatus, RentalType } from '#/db/schema'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

function calcTotalSen(dailyRateSen: number, start: string, end: string): number {
  if (!start || !end) return 0
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return 0
  const days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)))
  return dailyRateSen * days
}

function today(): string {
  return toDateInput(new Date())
}

// ─── Status tabs ──────────────────────────────────────────────────────────────

const RENTAL_STATUS_OPTIONS: { value: RentalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// ─── Sort ─────────────────────────────────────────────────────────────────────

type SortKey =
  | 'startDate'
  | 'endDate'
  | 'totalAmountSen'
  | 'status'
  | 'carPlateNumber'
  | 'customerFullName'
  | 'createdAt'

// ─── Sort ─────────────────────────────────────────────────────────────────────

type RentalFormData = {
  carId: string
  customerId: string
  type: RentalType
  startDate: string
  endDate: string
  dailyRateRM: string
  totalAmountRM: string
  depositRM: string
}

function emptyForm(): RentalFormData {
  return {
    carId: '',
    customerId: '',
    type: 'booking',
    startDate: today(),
    endDate: '',
    dailyRateRM: '',
    totalAmountRM: '',
    depositRM: '0',
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type RentalsListProps = {
  availableCars: AvailableCarOption[]
  allCustomers: CustomerRow[]
  session: { user: { name: string; email: string; role: string } }
  basePath: string
  canDelete: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalsList({
  availableCars,
  allCustomers,
  session,
  basePath,
  canDelete,
}: RentalsListProps) {
  const navigate = useNavigate()
  const [result, setResult] = useState<RentalListResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<RentalStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<CarCategoryFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>('startDate', 'desc')

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState<RentalFormData>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirm cancel
  const [confirmingCancel, setConfirmingCancel] = useState<RentalListRow | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Confirm delete
  const [confirmingDelete, setConfirmingDelete] = useState<RentalListRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Confirm handover
  const [handoverRental, setHandoverRental] = useState<RentalListRow | null>(null)
  const [startMileage, setStartMileage] = useState('')
  const [startCondition, setStartCondition] = useState('')
  const [handoverError, setHandoverError] = useState<string | null>(null)
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false)

  async function load(p = page) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listRentals({
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
      setLoadError(err instanceof Error ? err.message : 'Failed to load rentals.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
  const activeFilterCount =
    (activeTab !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)
  const hasActiveFilters =
    activeTab !== 'all' ||
    categoryFilter !== 'all' ||
    searchInput.trim().length > 0 ||
    search.length > 0

  type SelectOption = { value: string; label: string }

  const carItems = useMemo<SelectOption[]>(
    () =>
      availableCars.map((c) => ({
        value: c.id,
        label: `${c.plateNumber} · ${c.make} ${c.model}`,
      })),
    [availableCars],
  )

  const customerItems = useMemo<SelectOption[]>(
    () =>
      allCustomers.map((c) => ({
        value: c.id,
        label: c.icOrPassport
          ? `${c.fullName ?? '—'} · ${c.icOrPassport}`
          : (c.fullName ?? '—'),
      })),
    [allCustomers],
  )

  const selectedCarItem = carItems.find((i) => i.value === formData.carId) ?? null
  const selectedCustomerItem =
    customerItems.find((i) => i.value === formData.customerId) ?? null

  // ── Auto-calc total ───────────────────────────────────────────────────────

  function setField<K extends keyof RentalFormData>(key: K, value: RentalFormData[K]) {
    setFormData((prev) => {
      const next = { ...prev, [key]: value }
      // Recalculate total when dates or daily rate change
      if (key === 'startDate' || key === 'endDate' || key === 'dailyRateRM') {
        const dailyRateSen = Math.round(Number(next.dailyRateRM) * 100) || 0
        const totalSen = calcTotalSen(dailyRateSen, next.startDate, next.endDate)
        next.totalAmountRM = totalSen > 0 ? (totalSen / 100).toFixed(2) : next.totalAmountRM
      }
      // Auto-fill daily rate when car is selected
      if (key === 'carId') {
        const car = availableCars.find((c) => c.id === value)
        if (car) {
          const dailyRateSen = car.dailyRateSen
          next.dailyRateRM = (dailyRateSen / 100).toFixed(2)
          const totalSen = calcTotalSen(dailyRateSen, next.startDate, next.endDate)
          next.totalAmountRM = totalSen > 0 ? (totalSen / 100).toFixed(2) : ''
        }
      }
      return next
    })
  }

  // ── Form handlers ─────────────────────────────────────────────────────────

  function openAdd() {
    setFormData(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setFormError(null)
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.carId) { setFormError('Please select a car.'); return }
    if (!formData.customerId) { setFormError('Please select a customer.'); return }
    setFormError(null)
    setIsSubmitting(true)
    try {
      const dailyRateSen = Math.round(Number(formData.dailyRateRM) * 100)
      const totalAmountSen = Math.round(Number(formData.totalAmountRM) * 100)
      const depositAmountSen = Math.round(Number(formData.depositRM) * 100)

      await createRental({
        data: {
          carId: formData.carId,
          customerId: formData.customerId,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dailyRateSen,
          totalAmountSen,
          depositAmountSen,
        },
      })
      closeForm()
      setPage(1)
      await load(1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Cancel handler ────────────────────────────────────────────────────────

  async function handleCancelConfirm() {
    if (!confirmingCancel) return
    setCancelError(null)
    setIsCancelling(true)
    try {
      await cancelRental({ data: { rentalId: confirmingCancel.id } })
      setConfirmingCancel(null)
      await load(page)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancel failed.')
    } finally {
      setIsCancelling(false)
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!confirmingDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteRental({ data: { rentalId: confirmingDelete.id } })
      setConfirmingDelete(null)
      await load(page)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Handover handler ──────────────────────────────────────────────────────

  function openHandover(r: RentalListRow) {
    setHandoverRental(r)
    setStartMileage('')
    setStartCondition('')
    setHandoverError(null)
  }

  async function handleHandoverSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!handoverRental) return
    setHandoverError(null)
    setIsSubmittingHandover(true)
    try {
      await confirmHandover({
        data: {
          rentalId: handoverRental.id,
          startMileage: Number(startMileage),
          startConditionNote: startCondition || undefined,
        },
      })
      setHandoverRental(null)
      await load(page)
    } catch (err) {
      setHandoverError(err instanceof Error ? err.message : 'Failed to confirm handover.')
    } finally {
      setIsSubmittingHandover(false)
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<RentalListRow>[] = [
    {
      key: 'carPlateNumber',
      header: 'Car',
      sortable: true,
      render: (r) => (
        <>
          <span className="font-mono font-semibold text-[var(--lagoon-deep)]">
            {r.carPlateNumber ?? '—'}
          </span>
          <span className="ml-1.5 text-xs text-[var(--sea-ink-soft)]">
            {r.carMake} {r.carModel}
          </span>
        </>
      ),
    },
    {
      key: 'customerFullName',
      header: 'Customer',
      sortable: true,
      cellClassName: 'text-sm text-[var(--sea-ink)]',
      render: (r) => r.customerFullName ?? '—',
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => <span className="category-pill">{r.type === 'walk-in' ? 'Walk-in' : 'Booking'}</span>,
    },
    {
      key: 'startDate',
      header: 'Dates',
      sortable: true,
      cellClassName: 'text-xs text-[var(--sea-ink-soft)]',
      render: (r) => (
        <>
          {formatDateShort(r.startDate)}
          <span className="mx-1 opacity-40">→</span>
          {formatDateShort(r.endDate)}
        </>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (r) => <StatusBadge status={r.paymentStatus} size="sm" />,
    },
    {
      key: 'totalAmountSen',
      header: 'Total',
      sortable: true,
      cellClassName: 'font-mono text-sm',
      render: (r) => formatMYR(r.totalAmountSen),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (r) => {
        const rowActions: RowActionItem[] = []
        if (r.status === 'pending') {
          rowActions.push({
            label: 'Confirm handover',
            icon: <KeyRound />,
            onSelect: () => openHandover(r),
          })
          rowActions.push({
            label: 'Cancel',
            icon: <X />,
            onSelect: () => {
              setConfirmingCancel(r)
              setCancelError(null)
            },
          })
        }
        if (canDelete && (r.status === 'closed' || r.status === 'cancelled')) {
          rowActions.push({
            label: 'Delete',
            icon: <Trash2 />,
            variant: 'destructive',
            separatorBefore: rowActions.length > 0,
            onSelect: () => {
              setConfirmingDelete(r)
              setDeleteError(null)
            },
          })
        }
        if (rowActions.length === 0) return null
        return (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <RowActionsMenu
              label={`Actions for ${r.carPlateNumber ?? 'rental'}`}
              actions={rowActions}
            />
          </div>
        )
      },
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Rentals">
      {/* Page header */}
      <PageHeader
        kicker="Active rentals"
        title="Rentals"
        description={
          result
            ? `${result.total.toLocaleString()} rental${result.total !== 1 ? 's' : ''} total`
            : 'Loading…'
        }
        actions={
          <button type="button" className="button-primary flex items-center gap-2" onClick={openAdd}>
            <Plus size={15} />
            New rental
          </button>
        }
      />

      {loadError && (
        <ErrorPanel title="Failed to load rentals" message={loadError} onRetry={() => load()} />
      )}

      {loading && !result && <TableSkeleton rows={8} columns={7} />}

      {result && (
      <div className="space-y-3">
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <AdminListFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchClear={() => setSearch('')}
          searchPlaceholder="Customer or plate…"
          searchAriaLabel="Search rentals"
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
        >
          <StatusFilterSelect
            aria-label="Filter rentals by status"
            value={activeTab}
            options={RENTAL_STATUS_OPTIONS.map((tab) => ({
              value: tab.value,
              label:
                tab.value === 'all'
                  ? `${tab.label} (${tabCounts.all ?? 0})`
                  : `${tab.label}${typeof tabCounts[tab.value] === 'number' ? ` (${tabCounts[tab.value]})` : ''}`,
            }))}
            onValueChange={setActiveTab}
          />
          <StatusFilterSelect
            aria-label="Filter rentals by vehicle type"
            value={categoryFilter}
            options={CAR_CATEGORY_FILTER_OPTIONS}
            onValueChange={setCategoryFilter}
          />
        </AdminListFilterBar>

        <DataTable
          columns={columns}
          data={result.rows}
          getKey={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort as (key: string) => void}
          onRowClick={(r) =>
            void navigate({
              to: `${basePath}/$rentalId` as never,
              params: { rentalId: r.id } as never,
            })
          }
          emptyState={
            <div className="hub-empty-state m-6">
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {hasActiveFilters ? 'No rentals match your filter.' : 'No rentals yet.'}
              </p>
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
      )}

      {/* ── New Rental Sheet ── */}
      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) closeForm() }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[32rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">New rental</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Create rental
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="rental-form" className="space-y-4" onSubmit={handleFormSubmit}>
              {/* Type */}
              <div>
                <label className="field-label">Rental type</label>
                <div className="mt-1 flex gap-3">
                  {(['booking', 'walk-in'] as RentalType[]).map((t) => (
                    <label key={t} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="rental-type"
                        value={t}
                        checked={formData.type === t}
                        onChange={() => setField('type', t)}
                        className="accent-[var(--lagoon-deep)]"
                      />
                      <span className="text-sm text-[var(--sea-ink)]">
                        {t === 'booking' ? 'Advance booking' : 'Walk-in'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Car */}
              <div>
                <label className="field-label" htmlFor="rf-car">Car</label>
                <Combobox
                  items={carItems}
                  value={selectedCarItem}
                  onValueChange={(item) => setField('carId', item?.value ?? '')}
                  itemToStringLabel={(item) => item.label}
                >
                  <ComboboxInput
                    id="rf-car"
                    placeholder="Search by plate or model…"
                    className="w-full"
                    showClear={!!selectedCarItem}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No available cars found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Customer */}
              <div>
                <label className="field-label" htmlFor="rf-customer">Customer</label>
                <Combobox
                  items={customerItems}
                  value={selectedCustomerItem}
                  onValueChange={(item) => setField('customerId', item?.value ?? '')}
                  itemToStringLabel={(item) => item.label}
                >
                  <ComboboxInput
                    id="rf-customer"
                    placeholder="Search by name or IC…"
                    className="w-full"
                    showClear={!!selectedCustomerItem}
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>No customers found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="rf-start">Start date</label>
                  <input
                    id="rf-start"
                    type="date"
                    className="field-input"
                    value={formData.startDate}
                    min={today()}
                    onChange={(e) => setField('startDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="rf-end">End date</label>
                  <input
                    id="rf-end"
                    type="date"
                    className="field-input"
                    value={formData.endDate}
                    min={formData.startDate || today()}
                    onChange={(e) => setField('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Amounts — equal columns, short labels so they stay one line */}
              <div className="grid grid-cols-3 gap-3">
                <div className="min-w-0">
                  <label className="field-label whitespace-nowrap" htmlFor="rf-rate">
                    Rate (RM)
                  </label>
                  <input
                    id="rf-rate"
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
                <div className="min-w-0">
                  <label className="field-label whitespace-nowrap" htmlFor="rf-total">
                    Total (RM)
                  </label>
                  <input
                    id="rf-total"
                    type="number"
                    className="field-input"
                    value={formData.totalAmountRM}
                    onChange={(e) => setField('totalAmountRM', e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="min-w-0">
                  <label className="field-label whitespace-nowrap" htmlFor="rf-deposit">
                    Deposit (RM)
                  </label>
                  <input
                    id="rf-deposit"
                    type="number"
                    className="field-input"
                    value={formData.depositRM}
                    onChange={(e) => setField('depositRM', e.target.value)}
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && formData.dailyRateRM && (
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {Math.max(1, Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 86400000))} day(s) × RM {Number(formData.dailyRateRM).toFixed(2)} = RM {Number(formData.totalAmountRM).toFixed(2)}
                </p>
              )}

              {formError && <p className="form-error">{formError}</p>}
            </form>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="rental-form" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create rental'}
            </Button>
            <Button variant="outline" type="button" onClick={closeForm}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Confirm cancel ── */}
      <ConfirmActionDialog
        open={confirmingCancel != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingCancel(null)
            setCancelError(null)
          }
        }}
        title="Cancel this booking?"
        description={
          confirmingCancel ? (
            <>
              This will cancel the booking for{' '}
              <strong>{confirmingCancel.carPlateNumber}</strong> and release the car back to available.
              {cancelError ? (
                <span className="mt-2 block text-[var(--error)]">{cancelError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Cancel booking"
        cancelLabel="Keep"
        variant="destructive"
        confirming={isCancelling}
        onConfirm={handleCancelConfirm}
      />

      {/* ── Confirm delete ── */}
      <ConfirmActionDialog
        open={canDelete && confirmingDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDelete(null)
            setDeleteError(null)
          }
        }}
        title="Delete this rental?"
        description={
          confirmingDelete ? (
            <>
              Permanently remove the rental record for{' '}
              <strong>{confirmingDelete.carPlateNumber}</strong>. This cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      {/* ── Confirm handover Sheet ── */}
      <Sheet
        open={handoverRental != null}
        onOpenChange={(open) => {
          if (!open) {
            setHandoverRental(null)
            setHandoverError(null)
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Handover</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {handoverRental?.carPlateNumber ?? 'Rental'} — Confirm handover
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="list-handover-form" className="space-y-4" onSubmit={handleHandoverSubmit}>
              <div>
                <label className="field-label" htmlFor="list-ho-mileage">
                  Start mileage (km)
                </label>
                <input
                  id="list-ho-mileage"
                  type="number"
                  className="field-input"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="list-ho-condition">
                  Condition notes{' '}
                  <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <textarea
                  id="list-ho-condition"
                  className="field-input min-h-[80px]"
                  value={startCondition}
                  onChange={(e) => setStartCondition(e.target.value)}
                  placeholder="e.g. Minor scratches on rear bumper…"
                />
              </div>
              {handoverError ? <p className="form-error">{handoverError}</p> : null}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="list-handover-form" disabled={isSubmittingHandover}>
              {isSubmittingHandover ? 'Confirming…' : 'Confirm handover'}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setHandoverRental(null)
                setHandoverError(null)
              }}
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminSidebarShell>
  )
}
