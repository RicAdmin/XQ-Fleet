import { useEffect, useState } from 'react'

import { Search } from 'lucide-react'

import { BookingDrawer } from '#/components/admin/BookingDrawer'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
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
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 25

type Filters = {
  status: AdminBookingsInput['status']
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

  async function load(p = page, f = filters) {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminBookings({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: f.status,
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
  }, [filters.status, filters.from, filters.to, filters.search])

  function applyFilters(next: Filters) {
    setPage(1)
    setFilters(next)
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault()
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
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input
          type="date"
          className="field-input"
          value={filters.from ?? ''}
          onChange={(e) => applyFilters({ ...filters, from: e.target.value || undefined })}
          aria-label="Start date from"
        />
        <input
          type="date"
          className="field-input"
          value={filters.to ?? ''}
          onChange={(e) => applyFilters({ ...filters, to: e.target.value || undefined })}
          aria-label="Start date to"
        />
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
            />
            <input
              type="search"
              className="field-input pl-7"
              placeholder="Customer, car, coupon…"
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
      </div>

      {error && <ErrorPanel title="Failed to load bookings" message={error} onRetry={() => load()} />}

      {loading && !result && <TableSkeleton rows={8} columns={7} />}

      {result && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Car</th>
                <th>Dates</th>
                <th className="text-right">Total</th>
                <th className="text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No bookings match these filters.
                  </td>
                </tr>
              ) : (
                result.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="is-clickable"
                    onClick={() => setActiveRentalId(r.id)}
                  >
                    <td className="text-xs text-[var(--sea-ink-soft)]">{formatDate(r.createdAt)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-sm">
                      <div className="font-semibold text-[var(--sea-ink)]">
                        {r.customerFullName ?? '—'}
                      </div>
                      <div className="text-xs text-[var(--sea-ink-soft)]">{r.customerEmail ?? '—'}</div>
                    </td>
                    <td className="text-sm">
                      <div className="font-mono font-semibold">{r.carPlateNumber ?? '—'}</div>
                      <div className="text-xs text-[var(--sea-ink-soft)]">
                        {r.carMake} {r.carModel}
                      </div>
                    </td>
                    <td className="text-sm">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)}
                    </td>
                    <td className="text-right text-sm">{formatMYR(r.totalAmountSen)}</td>
                    <td className="text-right font-semibold">{formatMYR(r.paidAmountSen)}</td>
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
