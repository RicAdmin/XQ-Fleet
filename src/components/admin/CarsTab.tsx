import { useEffect, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { StatusBadge } from '#/components/ui/StatusBadge'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import type {
  AdminCarRow,
  AdminCarsInput,
  AdminCarsResult,
} from '#/lib/admin-dashboard-functions'
import { getAdminCarsForAdmin } from '#/lib/admin-dashboard-functions'
import type { CsvRow } from '#/lib/csv-export'
import { csvFilename } from '#/lib/csv-export'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const PAGE_SIZE = 25

type Filters = {
  status: AdminCarsInput['status']
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
    Status: r.status,
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

  async function load(p = page, f = filters) {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminCarsForAdmin({
        data: { page: p, pageSize: PAGE_SIZE, status: f.status, search: f.search },
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
  }, [filters.status, filters.search])

  function applyFilters(next: Filters) {
    setPage(1)
    setFilters(next)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilters({ ...filters, search: searchInput.trim() || undefined })
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <div className="admin-tab-panel">
      <div className="admin-filter-bar">
        <select
          className="field-input"
          value={filters.status ?? ''}
          onChange={(e) =>
            applyFilters({
              ...filters,
              status: (e.target.value || undefined) as Filters['status'],
            })
          }
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="payment-pending">Payment pending</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
          <option value="damaged">Damaged</option>
          <option value="retired">Retired</option>
        </select>
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
            />
            <input
              type="search"
              className="field-input pl-7"
              placeholder="Plate, make, model…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="button-secondary">
            Search
          </button>
        </form>
        <div className="filter-spacer" />
        <CsvDownloadButton
          filename={csvFilename('cars-page')}
          rows={result ? toRows(result.rows) : []}
          label="CSV (page)"
        />
      </div>

      {error && <ErrorPanel title="Failed to load cars" message={error} onRetry={() => load()} />}
      {loading && !result && <TableSkeleton rows={8} columns={6} />}

      {result && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Plate</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Status</th>
                <th className="text-right">Daily rate</th>
                <th className="text-right">Lifetime revenue</th>
                <th className="text-right">Rentals</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No cars match these filters.
                  </td>
                </tr>
              ) : (
                result.rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link
                        to="/admin/cars/$carId"
                        params={{ carId: r.id }}
                        className="plate-link font-mono"
                      >
                        {r.plateNumber}
                      </Link>
                    </td>
                    <td className="text-sm">
                      {r.make} {r.model} <span className="text-xs text-[var(--sea-ink-soft)]">{r.year}</span>
                    </td>
                    <td><span className="category-pill">{r.category}</span></td>
                    <td><StatusBadge status={r.status} size="sm" /></td>
                    <td className="text-right text-sm">{formatMYR(r.dailyRateSen)}</td>
                    <td className="text-right font-semibold">{formatMYR(r.lifetimeRevenueSen)}</td>
                    <td className="text-right">{r.lifetimeRentals}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  )
}
