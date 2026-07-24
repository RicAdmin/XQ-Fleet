import { useEffect, useMemo, useState } from 'react'

import { Link } from '@tanstack/react-router'

import { StatusBadge } from '#/components/ui/StatusBadge'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { AdminTablePagination } from '#/components/ui/AdminTablePagination'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import type {
  AdminCarRow,
  AdminCarsInput,
  AdminCarsResult,
} from '#/lib/admin-dashboard-functions'
import { getAdminCarsForAdmin } from '#/lib/admin-dashboard-functions'
import type { CsvRow } from '#/lib/csv-export'
import { csvFilename } from '#/lib/csv-export'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

type StatusFilter = NonNullable<AdminCarsInput['status']> | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'payment-pending', label: 'Payment pending' },
  { value: 'rented', label: 'Rented' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'retired', label: 'Retired' },
]

type Filters = {
  status: AdminCarsInput['status']
  category?: AdminCarsInput['category']
  search?: string
}

function toRows(rows: ReadonlyArray<AdminCarRow>): CsvRow[] {
  return rows.map((r) => ({
    'Car ID': r.id,
    Plate: r.plateNumber,
    Make: r.make,
    Model: r.model,
    Year: r.year,
    Category: r.category,
    Status: r.displayStatus,
    'Daily Rate (RM)': (r.dailyRateSen / 100).toFixed(2),
    'Lifetime Rentals': r.lifetimeRentals,
    'Lifetime Revenue (RM)': (r.lifetimeRevenueSen / 100).toFixed(2),
  }))
}

export function CarsTab() {
  const [filters, setFilters] = useState<Filters>({ status: undefined })
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminCarsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryTab, setCategoryTab] = useState<CarCategoryFilter>('all')

  async function load(p = page, f = filters) {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminCarsForAdmin({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: f.status,
          category: f.category,
          search: f.search,
        },
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cars.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category, filters.search])

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
    filters.status || filters.category || filters.search || searchInput.trim(),
  )

  const statusTab: StatusFilter = filters.status ?? 'all'
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  const columns = useMemo<Column<AdminCarRow>[]>(
    () => [
      {
        key: 'plate',
        header: 'Plate',
        render: (r) => (
          <Link
            to="/admin/cars/$carId"
            params={{ carId: r.id }}
            className="plate-link font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {r.plateNumber}
          </Link>
        ),
      },
      {
        key: 'vehicle',
        header: 'Vehicle',
        cellClassName: 'text-sm',
        render: (r) => (
          <>
            {r.make} {r.model}{' '}
            <span className="text-xs text-[var(--sea-ink-soft)]">{r.year}</span>
          </>
        ),
      },
      {
        key: 'category',
        header: 'Category',
        render: (r) => <span className="category-pill">{r.category}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => <StatusBadge status={r.displayStatus} size="sm" />,
      },
      {
        key: 'dailyRate',
        header: 'Daily rate',
        headerClassName: 'text-right',
        cellClassName: 'text-right text-sm tabular-nums',
        render: (r) => formatMYR(r.dailyRateSen),
      },
      {
        key: 'revenue',
        header: 'Lifetime revenue',
        headerClassName: 'text-right',
        cellClassName: 'text-right font-semibold tabular-nums',
        render: (r) => formatMYR(r.lifetimeRevenueSen),
      },
      {
        key: 'rentals',
        header: 'Rentals',
        headerClassName: 'text-right',
        cellClassName: 'text-right tabular-nums',
        render: (r) => r.lifetimeRentals,
      },
    ],
    [],
  )

  const toolbar = (
    <AdminListFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="Plate, make, model…"
      searchAriaLabel="Search cars"
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      activeFilterCount={activeFilterCount}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      actions={
        <CsvDownloadButton
          filename={csvFilename('cars-page')}
          rows={result ? toRows(result.rows) : []}
          label="CSV (page)"
        />
      }
    >
      <StatusFilterSelect
        aria-label="Filter cars by status"
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
        aria-label="Filter cars by vehicle type"
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
    </AdminListFilterBar>
  )

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <ErrorPanel
          title="Failed to load cars"
          message={error}
          onRetry={() => load()}
        />
      )}
      {loading && !result && (
        <article className="workspace-panel island-shell overflow-hidden p-0">
          {toolbar}
          <TableSkeleton rows={8} columns={6} />
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
              emptyState={
                <div className="text-center text-sm text-muted-foreground">
                  No cars match these filters.
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
    </div>
  )
}
