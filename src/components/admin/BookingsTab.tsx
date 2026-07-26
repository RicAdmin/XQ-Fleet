import { useCallback, useEffect, useMemo, useState } from 'react'

import { BookingDrawer } from '#/components/admin/BookingDrawer'
import { BackToTopButton } from '#/components/ui/BackToTopButton'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { DateRangeFilter, DateRangeQuickPresets } from '#/components/ui/DateRangeFilter'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { useInfiniteScroll } from '#/hooks/use-infinite-scroll'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import type {
  AdminBookingRow,
  AdminBookingsInput,
} from '#/lib/admin-dashboard-functions'
import {
  exportAdminBookings,
  getAdminBookings,
} from '#/lib/admin-dashboard-functions'
import type { CsvRow } from '#/lib/csv-export'
import { csvFilename } from '#/lib/csv-export'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

type StatusFilter = NonNullable<AdminBookingsInput['status']> | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type Filters = {
  status: AdminBookingsInput['status']
  category?: AdminBookingsInput['category']
  from?: string
  to?: string
  search?: string
}

function bookingsToCsvRows(rows: ReadonlyArray<AdminBookingRow>): CsvRow[] {
  return rows.map((r) => ({
    'Booking ID': r.id,
    Status: r.status,
    'Payment Status': r.paymentStatus,
    'Pickup Date': formatDate(r.startDate),
    'Return Date': formatDate(r.endDate),
    'Total (RM)': (r.totalAmountSen / 100).toFixed(2),
    'Paid (RM)': (r.paidAmountSen / 100).toFixed(2),
    Customer: r.customerFullName ?? '',
    Email: r.customerEmail ?? '',
    Car: r.carPlateNumber ?? '',
    Vehicle: `${r.carMake ?? ''} ${r.carModel ?? ''}`.trim(),
    'Coupon Code': r.couponCode ?? '',
    'Created At': new Date(r.createdAt).toISOString(),
  }))
}

export function BookingsTab() {
  const [filters, setFilters] = useState<Filters>({ status: undefined })
  const [rows, setRows] = useState<AdminBookingRow[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRentalId, setActiveRentalId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryTab, setCategoryTab] = useState<CarCategoryFilter>('all')

  const hasMore = total != null && rows.length < total
  const initialized = total != null

  const fetchPage = useCallback(async (p: number, f: Filters, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setRows([])
      setTotal(null)
    }
    setError(null)

    try {
      const res = await getAdminBookings({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: f.status,
          category: f.category,
          from: f.from,
          to: f.to,
          search: f.search,
          sortKey: 'createdAt',
          sortDir: 'desc',
        },
      })
      setTotal(res.total)
      setPage(res.page)
      setRows((prev) => (append ? [...prev, ...res.rows] : res.rows))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const reload = useCallback(() => {
    void fetchPage(1, filters, false)
  }, [fetchPage, filters])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    void fetchPage(page + 1, filters, true)
  }, [loading, loadingMore, hasMore, page, filters, fetchPage])

  const sentinelRef = useInfiniteScroll({
    enabled: hasMore && !loading && !loadingMore,
    onLoadMore: loadMore,
  })

  useEffect(() => {
    void fetchPage(1, filters, false)
  }, [filters.status, filters.category, filters.from, filters.to, filters.search, fetchPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined
      setFilters((prev) => {
        if (prev.search === next) return prev
        return { ...prev, search: next }
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  function applyFilters(next: Filters) {
    setFilters(next)
  }

  function clearFilters() {
    setSearchInput('')
    setCategoryTab('all')
    applyFilters({ status: undefined, category: undefined })
  }

  const activeFilterCount =
    (filters.status ? 1 : 0) + (filters.category ? 1 : 0)
  const hasActiveFilters = Boolean(
    filters.status ||
      filters.category ||
      filters.from ||
      filters.to ||
      filters.search ||
      searchInput.trim(),
  )

  const statusTab: StatusFilter = filters.status ?? 'all'

  const columns = useMemo<Column<AdminBookingRow>[]>(
    () => [
      {
        key: 'createdAt',
        header: 'Created',
        cellClassName: 'text-xs text-[var(--sea-ink-soft)]',
        render: (r) => formatDate(r.createdAt),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => <StatusBadge status={r.status} />,
      },
      {
        key: 'customer',
        header: 'Customer',
        cellClassName: 'whitespace-normal',
        render: (r) => (
          <div>
            <div className="font-semibold text-[var(--sea-ink)]">
              {r.customerFullName ?? '—'}
            </div>
            <div className="text-xs text-[var(--sea-ink-soft)]">
              {r.customerEmail ?? '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'car',
        header: 'Car',
        cellClassName: 'whitespace-normal',
        render: (r) => (
          <div>
            <div className="font-mono font-semibold">{r.carPlateNumber ?? '—'}</div>
            <div className="text-xs text-[var(--sea-ink-soft)]">
              {r.carMake} {r.carModel}
            </div>
          </div>
        ),
      },
      {
        key: 'dates',
        header: 'Dates',
        cellClassName: 'text-sm',
        render: (r) => (
          <>
            {formatDate(r.startDate)} → {formatDate(r.endDate)}
          </>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        headerClassName: 'text-right',
        cellClassName: 'text-right text-sm tabular-nums',
        render: (r) => formatMYR(r.totalAmountSen),
      },
      {
        key: 'paid',
        header: 'Paid',
        headerClassName: 'text-right',
        cellClassName: 'text-right font-semibold tabular-nums',
        render: (r) => formatMYR(r.paidAmountSen),
      },
    ],
    [],
  )

  const toolbar = (
    <AdminListFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Customer, car, coupon…"
      searchAriaLabel="Search bookings"
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      activeFilterCount={activeFilterCount}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      inlineControls={
        <div className="admin-filter-bar__quick-group">
          <span className="admin-filter-bar__quick-label">Quick range:</span>
          <DateRangeQuickPresets
            from={filters.from}
            to={filters.to}
            onRangeChange={(from, to) => applyFilters({ ...filters, from, to })}
          />
        </div>
      }
      actions={
        <>
          <CsvDownloadButton
            filename={csvFilename('bookings-loaded')}
            rows={bookingsToCsvRows(rows)}
            label="CSV (loaded)"
          />
          <CsvDownloadButton
            filename={csvFilename('bookings-all')}
            fetchRows={async () => {
              const all = await exportAdminBookings({
                data: {
                  status: filters.status,
                  category: filters.category,
                  from: filters.from,
                  to: filters.to,
                  search: filters.search,
                  sortKey: 'createdAt',
                  sortDir: 'desc',
                },
              })
              return bookingsToCsvRows(all)
            }}
            label="CSV (all)"
          />
        </>
      }
    >
      <StatusFilterSelect
        aria-label="Filter bookings by status"
        value={statusTab}
        options={STATUS_OPTIONS}
        onValueChange={(value) =>
          applyFilters({
            ...filters,
            status: value === 'all' ? undefined : value,
          })
        }
      />
      <StatusFilterSelect
        aria-label="Filter bookings by vehicle type"
        value={categoryTab}
        options={CAR_CATEGORY_FILTER_OPTIONS}
        onValueChange={(value) => {
          setCategoryTab(value)
          applyFilters({
            ...filters,
            category: value === 'all' ? undefined : value,
          })
        }}
      />
      <DateRangeFilter
        from={filters.from}
        to={filters.to}
        onFromChange={(from) => applyFilters({ ...filters, from })}
        onToChange={(to) => applyFilters({ ...filters, to })}
        onRangeChange={(from, to) => applyFilters({ ...filters, from, to })}
      />
    </AdminListFilterBar>
  )

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <ErrorPanel
          title="Failed to load bookings"
          message={error}
          onRetry={reload}
        />
      )}

      {loading && !initialized && (
        <article className="workspace-panel island-shell overflow-hidden p-0">
          {toolbar}
          <TableSkeleton rows={8} columns={7} />
        </article>
      )}

      {initialized && (
        <article className="workspace-panel island-shell overflow-hidden p-0">
          {toolbar}
          <DataTable
            columns={columns}
            data={rows}
            getKey={(r) => r.id}
            onRowClick={(r) => setActiveRentalId(r.id)}
            emptyState={
              <div className="text-center text-sm text-muted-foreground">
                No bookings match these filters.
              </div>
            }
          />
          <div ref={sentinelRef} className="admin-infinite-sentinel" aria-hidden />
          <div className="admin-infinite-status">
            {loadingMore
              ? 'Loading more bookings…'
              : hasMore
                ? `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()} · scroll for more`
                : `${total.toLocaleString()} booking${total === 1 ? '' : 's'} · end of list`}
          </div>
        </article>
      )}

      <BackToTopButton />

      {activeRentalId && (
        <BookingDrawer
          rentalId={activeRentalId}
          open={!!activeRentalId}
          onClose={() => setActiveRentalId(null)}
          onMutated={reload}
        />
      )}
    </div>
  )
}
