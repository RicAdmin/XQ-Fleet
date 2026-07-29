import { useEffect, useRef, useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'
import { Check, Copy, KeyRound, Plus, Trash2, X } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { AdminListFilterBar, AdminQuickFilterChips } from '#/components/ui/AdminListFilterBar'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { CsJobArrangementCell } from '#/components/rentals/CsJobScheduleCell'
import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { DueBadge } from '#/components/admin/operations-queue-utils'
import { formatJobDurationLabel, formatJobSource, formatFulfillmentLabel, isJobOverdue, jobBookingRef, type JobSource } from '#/lib/job-display'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'
import { cn } from '#/lib/utils'
import type { RentalListResult, RentalListRow } from '#/lib/rental-functions'
import {
  cancelRental,
  confirmHandover,
  deleteRental,
  getRentalStatusCounts,
  listRentals,
} from '#/lib/rental-functions'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import type { PaymentStatus, RentalStatus } from '#/db/schema'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function toDateInput(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function today(): string {
  return toDateInput(new Date())
}

function addDaysYmd(baseYmd: string, days: number): string {
  const d = new Date(`${baseYmd}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toDateInput(d)
}

type DayFilterPreset = 'today' | 'in3d' | 'week' | 'custom' | null

function dayFilterRange(preset: Exclude<DayFilterPreset, 'custom' | null>): [string, string] {
  const start = today()
  if (preset === 'today') return [start, start]
  if (preset === 'in3d') return [start, addDaysYmd(start, 3)]
  return [start, addDaysYmd(start, 7)]
}

function detectDayFilterPreset(from?: string, to?: string): DayFilterPreset {
  if (!from || !to) return null
  const todayRange = dayFilterRange('today')
  if (from === todayRange[0] && to === todayRange[1]) return 'today'
  const in3d = dayFilterRange('in3d')
  if (from === in3d[0] && to === in3d[1]) return 'in3d'
  const week = dayFilterRange('week')
  if (from === week[0] && to === week[1]) return 'week'
  return 'custom'
}

// ─── Status tabs ──────────────────────────────────────────────────────────────

const RENTAL_STATUS_OPTIONS: { value: RentalStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Booked' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type PaymentFilter = PaymentStatus | 'all'
type SourceFilter = JobSource | 'all'

const PAYMENT_FILTER_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: 'all', label: 'All payments' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
]

const SOURCE_FILTER_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'in-house', label: 'In-House' },
  { value: 'web', label: 'Web' },
  { value: 'sales-agent', label: 'Sales Agent' },
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

// ─── Props ────────────────────────────────────────────────────────────────────

type RentalsListProps = {
  session: { user: { name: string; email: string; role: string } }
  basePath: string
  canDelete?: boolean
  /** CS desk can create/cancel jobs; ops floor is read + handover only. */
  jobMode?: 'manage' | 'operations'
  initialResult?: RentalListResult
  initialStatusCounts?: Record<string, number>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalsList({
  session,
  basePath,
  canDelete = false,
  jobMode = 'manage',
  initialResult,
  initialStatusCounts,
}: RentalsListProps) {
  const isManageMode = jobMode === 'manage'
  const navigate = useNavigate()
  const skipInitialLoad = useRef(Boolean(initialResult))
  const [result, setResult] = useState<RentalListResult | null>(initialResult ?? null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
    initialStatusCounts ?? initialResult?.statusCounts ?? { all: 0 },
  )
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<RentalStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<CarCategoryFilter>('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | undefined>()
  const [dateTo, setDateTo] = useState<string | undefined>()
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>('createdAt', 'desc')

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

  const [copiedJobId, setCopiedJobId] = useState<string | null>(null)

  async function refreshStatusCounts() {
    try {
      const counts = await getRentalStatusCounts()
      setStatusCounts(counts)
    } catch {
      // Tab counts are non-blocking; list data is still usable.
    }
  }

  async function load(p = page) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listRentals({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: activeTab === 'all' ? undefined : activeTab,
          paymentStatus: paymentFilter === 'all' ? undefined : paymentFilter,
          source: sourceFilter === 'all' ? undefined : sourceFilter,
          overdue: overdueOnly || undefined,
          category: categoryFilter === 'all' ? undefined : categoryFilter,
          search: search || undefined,
          from: dateFrom,
          to: dateTo,
          sortKey,
          sortDir,
        },
      })
      setResult(res)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load jobs.')
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
  }, [activeTab, categoryFilter, paymentFilter, sourceFilter, overdueOnly, search, dateFrom, dateTo, sortKey, sortDir])

  useEffect(() => {
    if (initialStatusCounts || initialResult?.statusCounts) return
    void refreshStatusCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => (prev === next ? prev : next))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const tabCounts = statusCounts
  const dayPreset = detectDayFilterPreset(dateFrom, dateTo)
  const activeFilterCount =
    (categoryFilter !== 'all' ? 1 : 0) +
    (paymentFilter !== 'all' ? 1 : 0) +
    (sourceFilter !== 'all' ? 1 : 0) +
    (overdueOnly ? 1 : 0)
  const hasActiveFilters =
    activeTab !== 'all' ||
    activeFilterCount > 0 ||
    searchInput.trim().length > 0 ||
    search.length > 0 ||
    Boolean(dateFrom || dateTo)

  function applyDayPreset(preset: 'today' | 'in3d' | 'week') {
    const [from, to] = dayFilterRange(preset)
    setDateFrom(from)
    setDateTo(to)
    setCustomFrom(from)
    setCustomTo(to)
  }

  function clearDayFilter() {
    setDateFrom(undefined)
    setDateTo(undefined)
    setCustomFrom('')
    setCustomTo('')
  }

  function applyCustomDayRange() {
    if (!customFrom || !customTo) return
    if (customTo < customFrom) {
      showAdminToast('End date must be on or after start date.')
      return
    }
    setDateFrom(customFrom)
    setDateTo(customTo)
  }

  // ── Cancel handler ────────────────────────────────────────────────────────

  async function handleCancelConfirm() {
    if (!confirmingCancel) return
    setCancelError(null)
    setIsCancelling(true)
    try {
      await cancelRental({ data: { rentalId: confirmingCancel.id } })
      setConfirmingCancel(null)
      showAdminToast('Job cancelled.')
      await Promise.all([load(page), refreshStatusCounts()])
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
      showAdminToast('Job deleted.')
      await Promise.all([load(page), refreshStatusCounts()])
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
      showAdminToast('Handover confirmed.')
      await Promise.all([load(page), refreshStatusCounts()])
    } catch (err) {
      setHandoverError(err instanceof Error ? err.message : 'Failed to confirm handover.')
    } finally {
      setIsSubmittingHandover(false)
    }
  }

  async function copyJobId(rentalId: string) {
    const ref = jobBookingRef(rentalId)
    try {
      await navigator.clipboard.writeText(ref)
      setCopiedJobId(rentalId)
      showAdminToast(`Copied ${ref}`)
      window.setTimeout(() => {
        setCopiedJobId((prev) => (prev === rentalId ? null : prev))
      }, 1500)
    } catch {
      showAdminToast('Could not copy Job ID')
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<RentalListRow>[] = [
    {
      key: 'id',
      header: 'Job ID',
      cellClassName: 'whitespace-nowrap',
      render: (r) => {
        const ref = jobBookingRef(r.id)
        const copied = copiedJobId === r.id
        return (
          <div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm font-semibold text-[var(--lagoon-deep)]">
                {ref}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-6 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                aria-label={`Copy Job ID ${ref}`}
                title="Copy Job ID"
                onClick={(e) => {
                  e.stopPropagation()
                  void copyJobId(r.id)
                }}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </Button>
            </div>
            <div className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
              {formatJobSource(r)}
            </div>
          </div>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      render: (r) => (
        <div className="text-sm leading-snug text-[var(--sea-ink)]">
          <div className="tabular-nums">
            {r.createdAt.toLocaleDateString('en-MY', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="mt-0.5 text-xs tabular-nums text-[var(--sea-ink-soft)]">
            {r.createdAt.toLocaleTimeString('en-MY', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'carPlateNumber',
      header: 'Car',
      sortable: true,
      render: (r) => (
        <div>
          <div className="text-sm font-medium text-[var(--sea-ink)]">
            {[r.carMake, r.carModel].filter(Boolean).join(' ') || '—'}
          </div>
          <div className="mt-0.5 font-mono text-xs text-[var(--sea-ink-soft)]">
            {r.carPlateNumber ?? '—'}
          </div>
          {r.fulfillmentSource && r.fulfillmentSource !== 'owned' ? (
            <div className="mt-0.5 text-[0.6875rem] font-medium text-amber-700">
              {formatFulfillmentLabel(r.fulfillmentSource)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Arrangement',
      sortable: true,
      cellClassName: 'whitespace-normal',
      render: (r) => <CsJobArrangementCell rental={r} />,
    },
    {
      key: 'customerFullName',
      header: 'Customer',
      sortable: true,
      cellClassName: 'min-w-[10rem] whitespace-normal',
      render: (r) => (
        <div className="text-sm leading-relaxed text-[var(--sea-ink)]">
          <div className="font-medium">{r.customerFullName ?? '—'}</div>
          <div className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
            {r.customerPhone ?? '—'}
          </div>
          <div className="mt-0.5 truncate text-xs text-[var(--sea-ink-soft)]">
            {r.customerEmail ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmountSen',
      header: 'Payment',
      sortable: true,
      cellClassName: 'whitespace-nowrap',
      render: (r) => {
        const balanceSen = r.totalAmountSen - r.paidAmountSen
        return (
          <div>
            <div className="font-mono text-sm font-semibold tabular-nums text-[var(--sea-ink)]">
              {formatMYR(r.totalAmountSen)}
            </div>
            {r.paymentStatus === 'paid' ? (
              <div className="mt-0.5 text-xs font-medium text-emerald-700">Fully paid</div>
            ) : balanceSen > 0 ? (
              <div className="mt-0.5 text-xs font-semibold tabular-nums text-red-600">
                Balance {formatMYR(balanceSen)}
              </div>
            ) : null}
            <div className="mt-0.5 text-xs font-medium tabular-nums text-[var(--sea-ink-soft)]">
              {formatJobDurationLabel(r.startDate, r.endDate, r.extraHoursDecimal)}
            </div>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={r.status} size="sm" />
          <StatusBadge status={r.paymentStatus} size="sm" />
          <DueBadge overdue={isJobOverdue(r)} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (r) => {
        const canHandover = r.status === 'confirmed'
        const canCancel =
          isManageMode && (r.status === 'pending' || r.status === 'confirmed')
        const showDelete =
          isManageMode && canDelete && (r.status === 'closed' || r.status === 'cancelled')

        if (!canHandover && !canCancel && !showDelete) {
          return <span className="text-xs text-[var(--sea-ink-soft)]">—</span>
        }

        return (
          <div
            className="inline-flex items-center justify-end gap-0.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {canHandover ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                aria-label={`Confirm handover for ${r.carPlateNumber ?? 'job'}`}
                title="Confirm handover"
                onClick={() => openHandover(r)}
              >
                <KeyRound className="size-4" />
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
                aria-label={`Cancel ${r.carPlateNumber ?? 'job'}`}
                title="Cancel"
                onClick={() => {
                  setConfirmingCancel(r)
                  setCancelError(null)
                }}
              >
                <X className="size-4" />
              </Button>
            ) : null}
            {showDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-[var(--sea-ink-soft)] hover:text-red-600"
                aria-label={`Delete ${r.carPlateNumber ?? 'job'}`}
                title="Delete"
                onClick={() => {
                  setConfirmingDelete(r)
                  setDeleteError(null)
                }}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Jobs">
      <PageHeader
        kicker={isManageMode ? 'Customer service' : 'Operations'}
        title="Jobs"
        description={
          isManageMode
            ? result
              ? `${result.total.toLocaleString()} job${result.total !== 1 ? 's' : ''} total — in-house and online bookings`
              : 'Loading…'
            : result
              ? `${result.total.toLocaleString()} open job${result.total !== 1 ? 's' : ''} — status updates only`
              : 'Loading…'
        }
        actions={
          <div className="flex flex-wrap items-center gap-1">
            <div className="jobs-day-group">
              {(
                [
                  { key: 'today' as const, label: 'Today' },
                  { key: 'in3d' as const, label: 'In 3D' },
                  { key: 'week' as const, label: '1 Week' },
                ] as const
              ).map((preset) => {
                const isActive = dayPreset === preset.key
                return (
                  <button
                    key={preset.key}
                    type="button"
                    className={cn(
                      'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--ui-ink)] text-white'
                        : 'text-[var(--sea-ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--sea-ink)]',
                    )}
                    aria-pressed={isActive}
                    onClick={() => {
                      if (isActive) clearDayFilter()
                      else applyDayPreset(preset.key)
                    }}
                  >
                    {preset.label}
                  </button>
                )
              })}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
                        dayPreset === 'custom'
                          ? 'bg-[var(--ui-ink)] text-white'
                          : 'text-[var(--sea-ink-soft)] hover:bg-[var(--surface-muted)] hover:text-[var(--sea-ink)]',
                      )}
                      aria-pressed={dayPreset === 'custom'}
                    />
                  }
                >
                  Custom date
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="field-label" htmlFor="jobs-day-from">
                      From
                    </label>
                    <input
                      id="jobs-day-from"
                      type="date"
                      className="field-input"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="jobs-day-to">
                      To
                    </label>
                    <input
                      id="jobs-day-to"
                      type="date"
                      className="field-input"
                      value={customTo}
                      min={customFrom || undefined}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={clearDayFilter}>
                      Clear
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!customFrom || !customTo}
                      onClick={applyCustomDayRange}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {isManageMode ? (
              <Link
                to="/admin/availability"
                className="button-primary jobs-create-btn"
              >
                <Plus className="size-4" />
                Create job
              </Link>
            ) : null}
          </div>
        }
      />

      {loadError && (
        <ErrorPanel title="Failed to load jobs" message={loadError} onRetry={() => load()} />
      )}

      {loading && !result && <TableSkeleton rows={8} columns={8} />}

      <div className="admin-stack">
      {result && (
      <>
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <AdminListFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchClear={() => setSearch('')}
          searchPlaceholder="Customer, phone, or plate…"
          searchAriaLabel="Search jobs"
          resultSummary={
            result
              ? `${result.total.toLocaleString()} job${result.total !== 1 ? 's' : ''}`
              : undefined
          }
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setActiveTab('all')
            setCategoryFilter('all')
            setPaymentFilter('all')
            setSourceFilter('all')
            setOverdueOnly(false)
            setSearchInput('')
            setSearch('')
            clearDayFilter()
          }}
          quickFilters={
            <AdminQuickFilterChips
              label="Quick status:"
              value={activeTab}
              options={RENTAL_STATUS_OPTIONS.map((tab) => ({
                value: tab.value,
                label:
                  tab.value === 'all'
                    ? tab.label
                    : typeof tabCounts[tab.value] === 'number'
                      ? `${tab.label} (${tabCounts[tab.value]})`
                      : tab.label,
              }))}
              onValueChange={(value) => setActiveTab(value as RentalStatus | 'all')}
            />
          }
        >
          <StatusFilterSelect
            aria-label="Filter jobs by vehicle type"
            value={categoryFilter}
            options={CAR_CATEGORY_FILTER_OPTIONS}
            onValueChange={setCategoryFilter}
          />
          <StatusFilterSelect
            aria-label="Filter jobs by payment status"
            value={paymentFilter}
            options={PAYMENT_FILTER_OPTIONS}
            onValueChange={setPaymentFilter}
          />
          <StatusFilterSelect
            aria-label="Filter jobs by source"
            value={sourceFilter}
            options={SOURCE_FILTER_OPTIONS}
            onValueChange={setSourceFilter}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-active={overdueOnly ? 'true' : 'false'}
            aria-pressed={overdueOnly}
            className={cn(
              'admin-filter-preset h-8 min-h-8',
              overdueOnly && 'border-red-600 text-red-700',
            )}
            onClick={() => setOverdueOnly((prev) => !prev)}
          >
            Overdue returns
          </Button>
        </AdminListFilterBar>

        <DataTable
          columns={columns}
          data={result.rows}
          getKey={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort as (key: string) => void}
          onRowClick={(r) =>
            void navigate(
              basePath === INTERNAL_JOBS_PATH
                ? { to: '/internal/jobs/$jobId', params: { jobId: r.id } }
                : {
                    to: `${basePath}/$rentalId` as '/admin/rentals/$rentalId',
                    params: { rentalId: r.id },
                  },
            )
          }
          emptyState={
            <div className="hub-empty-state m-6">
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {hasActiveFilters ? 'No jobs match your filter.' : 'No jobs yet.'}
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
      </>
      )}
      </div>

      {/* ── Confirm cancel ── */}
      <ConfirmActionDialog
        open={confirmingCancel != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingCancel(null)
            setCancelError(null)
          }
        }}
        title="Cancel this job?"
        description={
          confirmingCancel ? (
            <>
              This will cancel the job for{' '}
              <strong>{confirmingCancel.carPlateNumber}</strong> and release the vehicle.
              {cancelError ? (
                <span className="mt-2 block text-[var(--error)]">{cancelError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Cancel job"
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
        title="Delete this job?"
        description={
          confirmingDelete ? (
            <>
              Permanently remove the job record for{' '}
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
