import { useEffect, useMemo, useRef, useState } from 'react'

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
  AdminPaymentRow,
  AdminPaymentsInput,
  AdminPaymentsResult,
} from '#/lib/admin-dashboard-functions'
import { getAdminPayments } from '#/lib/admin-dashboard-functions'
import type { CsvRow } from '#/lib/csv-export'
import { csvFilename } from '#/lib/csv-export'

function formatMYR(sen: number, currency = 'MYR'): string {
  const amount = (sen / 100).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency === 'MYR' ? 'RM' : currency} ${amount}`
}

function formatDateTime(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-MY')
}

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

type StatusFilter = NonNullable<AdminPaymentsInput['status']> | 'all'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'successful', label: 'Successful' },
  { value: 'failed', label: 'Failed' },
  { value: 'voided', label: 'Voided' },
]

type Filters = {
  status: AdminPaymentsInput['status']
  category?: AdminPaymentsInput['category']
  from?: string
  to?: string
  search?: string
}

function toRows(rows: ReadonlyArray<AdminPaymentRow>): CsvRow[] {
  return rows.map((r) => ({
    'Payment ID': r.id,
    'Rental ID': r.rentalId,
    Provider: r.provider,
    Status: r.status,
    'External Ref': r.externalRef ?? '',
    'Amount (RM)': (r.amountSen / 100).toFixed(2),
    Currency: r.currency,
    Method: r.paymentMethod ?? '',
    'Car Plate': r.rentalCarPlateNumber ?? '',
    Customer: r.rentalCustomerFullName ?? '',
    Created: new Date(r.createdAt).toISOString(),
    'Responded At': r.respondedAt ? new Date(r.respondedAt).toISOString() : '',
  }))
}

export function PaymentsTab({
  initialResult,
}: {
  initialResult?: AdminPaymentsResult
}) {
  const skipInitialLoad = useRef(Boolean(initialResult))
  const [filters, setFilters] = useState<Filters>({ status: undefined })
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminPaymentsResult | null>(initialResult ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryTab, setCategoryTab] = useState<CarCategoryFilter>('all')

  async function load(p = page, f = filters) {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminPayments({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: f.status,
          category: f.category,
          from: f.from,
          to: f.to,
          search: f.search,
        },
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
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

  const columns = useMemo<Column<AdminPaymentRow>[]>(
    () => [
      {
        key: 'createdAt',
        header: 'Created',
        cellClassName: 'whitespace-nowrap',
        render: (r) => formatDateTime(r.createdAt),
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => <StatusBadge status={r.status} size="sm" />,
      },
      {
        key: 'method',
        header: 'Method',
        render: (r) => r.paymentMethod ?? r.provider,
      },
      {
        key: 'reference',
        header: 'Reference',
        cellClassName: 'max-w-[14rem] truncate font-mono text-[13px]',
        render: (r) => r.externalRef ?? '—',
      },
      {
        key: 'rental',
        header: 'Rental',
        cellClassName: 'whitespace-normal',
        render: (r) => (
          <div>
            <div className="font-mono text-[13px]">{r.rentalCarPlateNumber ?? '—'}</div>
            <div className="text-xs text-[var(--sea-ink-soft)]">
              {r.rentalCustomerFullName ?? '—'}
            </div>
          </div>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        headerClassName: 'text-right',
        cellClassName: 'text-right font-semibold tabular-nums',
        render: (r) => formatMYR(r.amountSen, r.currency),
      },
    ],
    [],
  )

  const toolbar = (
    <AdminListFilterBar
      searchValue={searchInput}
      onSearchChange={setSearchInput}
      searchPlaceholder="External ref, car, customer…"
      searchAriaLabel="Search payments"
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
        <CsvDownloadButton
          filename={csvFilename('payments-page')}
          rows={result ? toRows(result.rows) : []}
          label="CSV (page)"
        />
      }
    >
      <StatusFilterSelect
        aria-label="Filter payments by status"
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
        aria-label="Filter payments by vehicle type"
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
          title="Failed to load payments"
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
        <div className="admin-stack">
          <article className="workspace-panel island-shell overflow-hidden p-0">
            {toolbar}
            <DataTable
              columns={columns}
              data={[...result.rows]}
              getKey={(r) => r.id}
              emptyState={
                <div className="text-center text-sm text-muted-foreground">
                  No payments match these filters.
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
