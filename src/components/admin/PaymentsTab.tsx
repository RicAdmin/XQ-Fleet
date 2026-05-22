import { useEffect, useState } from 'react'

import { Search } from 'lucide-react'

import { StatusBadge } from '#/components/ui/StatusBadge'
import { CsvDownloadButton } from '#/components/ui/CsvDownloadButton'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
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

type Filters = {
  status: AdminPaymentsInput['status']
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

export function PaymentsTab() {
  const [filters, setFilters] = useState<Filters>({ status: undefined })
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminPaymentsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')

  async function load(p = page, f = filters) {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminPayments({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: f.status,
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
    void load(1, filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.from, filters.to, filters.search])

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
          <option value="pending">Pending</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="voided">Voided</option>
        </select>
        <input
          type="date"
          className="field-input"
          value={filters.from ?? ''}
          onChange={(e) => applyFilters({ ...filters, from: e.target.value || undefined })}
        />
        <input
          type="date"
          className="field-input"
          value={filters.to ?? ''}
          onChange={(e) => applyFilters({ ...filters, to: e.target.value || undefined })}
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
              placeholder="External ref, car, customer…"
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
          filename={csvFilename('payments-page')}
          rows={result ? toRows(result.rows) : []}
          label="CSV (page)"
        />
      </div>

      {error && <ErrorPanel title="Failed to load payments" message={error} onRetry={() => load()} />}
      {loading && !result && <TableSkeleton rows={8} columns={6} />}

      {result && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Status</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Rental</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No payments match these filters.
                  </td>
                </tr>
              ) : (
                result.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-xs">{formatDateTime(r.createdAt)}</td>
                    <td><StatusBadge status={r.status} size="sm" /></td>
                    <td className="text-sm">{r.paymentMethod ?? r.provider}</td>
                    <td className="text-xs font-mono break-all">{r.externalRef ?? '—'}</td>
                    <td className="text-sm">
                      <div className="font-mono">{r.rentalCarPlateNumber ?? '—'}</div>
                      <div className="text-xs text-[var(--sea-ink-soft)]">
                        {r.rentalCustomerFullName ?? '—'}
                      </div>
                    </td>
                    <td className="text-right font-semibold">{formatMYR(r.amountSen, r.currency)}</td>
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
