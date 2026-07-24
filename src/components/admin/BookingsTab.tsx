import { useEffect, useMemo, useState } from 'react'

import { BookingDrawer } from '#/components/admin/BookingDrawer'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { AdminTablePagination } from '#/components/ui/AdminTablePagination'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { DateRangeFilter, DateRangeQuickPresets } from '#/components/ui/DateRangeFilter'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import type {
  AdminBookingRow,
  AdminBookingsInput,
  AdminBookingsResult,
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
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminBookingsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeRentalId, setActiveRentalId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryTab, setCategoryTab] = useState<CarCategoryFilter>('all')

  async function load(p = page, f = filters) {
    setLoading(true)
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
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category, filters.from, filters.to, filters.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim() || undefined
      setFilters((prev) => {
        if (prev.search === next) return prev
        setPage(1)
        return { ...prev, search: next }
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  function applyFilters(next: Filters) {
    setPage(1)
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
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

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
        <DateRangeQuickPresets
          from={filters.from}
          to={filters.to}
          onRangeChange={(from, to) => applyFilters({ ...filters, from, to })}
        />
      }
      actions={
        <>
          <CsvDownloadButton
            filename={csvFilename('bookings-page')}
            rows={result ? bookingsToCsvRows(result.rows) : []}
            label="CSV (page)"
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
          onRetry={() => load()}
        />
      )}

      {loading && !result && (
        <article className="workspace-panel island-shell overflow-hidden p-0">
          {toolbar}
          <TableSkeleton rows={8} columns={7} />
        </article>
      )}

      {result && (
        <div className="space-y-3">
          <article className="workspace-panel island-shell overflow-hidden p-0">
            {toolbar}
            <DataTable
              columns={columns}
              data={[...result.rows]}
              getKey={(r) => r.id}
              onRowClick={(r) => setActiveRentalId(r.id)}
              emptyState={
                <div className="text-center text-sm text-muted-foreground">
                  No bookings match these filters.
                </div>
              }
            />
          </article>
          <AdminTablePagination
            page={result.page}
            totalPages={totalPages}
            total={result.total}
            loading={loading}
            onPageChange={(p) => {
              setPage(p)
              void load(p)
            }}
          />
        </div>
      )}

      {activeRentalId && (
        <BookingDrawer
          rentalId={activeRentalId}
          open={!!activeRentalId}
          onClose={() => setActiveRentalId(null)}
          onMutated={() => {
            void load(page)
          }}
        />
      )}
    </div>
  )
}
