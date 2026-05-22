import { useEffect, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus, Wallet } from 'lucide-react'

import { AffiliateFormSheet } from '#/components/admin/AffiliateFormSheet'
import { PageHeader } from '#/components/ui/PageHeader'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { UI_BTN_XS } from '#/lib/admin-ui-classes'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { requireFullAdminAccess } from '#/lib/route-guards'
import {
  listAffiliates,
  type AdminAffiliateListResult,
  type AdminAffiliateListRow,
} from '#/lib/affiliate-functions'

export const Route = createFileRoute('/admin/affiliates/')({
  beforeLoad: async () => requireFullAdminAccess(),
  component: AdminAffiliatesPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load affiliates"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

type Filter = 'all' | 'active' | 'paused' | 'archived'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'archived', label: 'Archived' },
]

function formatRM(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { maximumFractionDigits: 2 })}`
}

function formatCommission(row: AdminAffiliateListRow): string {
  if (row.commissionType === 'percent') return `${row.commissionValueSen}%`
  return formatRM(row.commissionValueSen)
}

function AdminAffiliatesPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }

  const [filter, setFilter] = useState<Filter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminAffiliateListResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminAffiliateListRow | null>(null)

  async function load(p = page) {
    setLoading(true)
    setError(null)
    try {
      const res = await listAffiliates({
        data: {
          page: p,
          pageSize: 25,
          status: filter,
          search: search || undefined,
        },
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load affiliates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <AdminSidebarShell user={session.user} pageTitle="Affiliates">
      <PageHeader
        title="Affiliates"
        description="Programme members, attribution stats, and payouts."
        actions={
          <>
            <Link
              to="/admin/affiliates/payouts"
              className="button-secondary inline-flex items-center gap-1.5"
            >
              <Wallet size={14} /> Payouts
            </Link>
            <button
              type="button"
              className="button-primary inline-flex items-center gap-1.5"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus size={14} /> New affiliate
            </button>
          </>
        }
      />

      <div className="admin-filter-bar">
        <div className="status-tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`status-tab${filter === f.key ? ' is-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(searchInput.trim())
          }}
        >
          <input
            type="search"
            className="field-input"
            placeholder="Search name, code, email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="button-secondary">
            Search
          </button>
        </form>
      </div>

      {error && <ErrorPanel title="Failed to load affiliates" message={error} onRetry={() => load()} />}
      {loading && !result && <TableSkeleton rows={6} columns={7} />}

      {result && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Commission</th>
                <th className="text-right">Clicks</th>
                <th className="text-right">Bookings</th>
                <th className="text-right">Earned</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No affiliates found.
                  </td>
                </tr>
              ) : (
                result.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        to="/admin/affiliates/$affiliateId"
                        params={{ affiliateId: row.id }}
                        className="plate-link"
                      >
                        {row.name}
                      </Link>
                      <div className="text-xs text-[var(--sea-ink-soft)]">
                        {row.email}
                      </div>
                    </td>
                    <td className="font-mono text-sm">/r/{row.code}</td>
                    <td className="text-sm">{formatCommission(row)}</td>
                    <td className="text-sm text-right">{row.clicks.toLocaleString()}</td>
                    <td className="text-sm text-right">{row.bookings.toLocaleString()}</td>
                    <td className="text-sm text-right">{formatRM(row.earnedSen)}</td>
                    <td className="text-sm text-right">{formatRM(row.paidSen)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className={UI_BTN_XS}
                        onClick={() => {
                          setEditing(row)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </button>
                    </td>
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

      <AffiliateFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={() => void load()}
      />
    </AdminSidebarShell>
  )
}
