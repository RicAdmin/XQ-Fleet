import { useEffect, useState } from 'react'

import { Link, createFileRoute } from '@tanstack/react-router'
import { Plus, Sparkles } from 'lucide-react'

import { PromoBulkGenerateSheet } from '#/components/admin/PromoBulkGenerateSheet'
import { PromoFormSheet } from '#/components/admin/PromoFormSheet'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { UI_BTN_XS } from '#/lib/admin-ui-classes'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { requireFullAdminAccess } from '#/lib/route-guards'
import type {
  AdminPromoListResult,
  AdminPromoListRow,
} from '#/lib/promo-functions'
import { listPromos } from '#/lib/promo-functions'

export const Route = createFileRoute('/admin/promos/')({
  beforeLoad: async () => requireFullAdminAccess(),
  component: AdminPromosPage,
  errorComponent: ({ error, reset }) => (
    <ErrorPanel
      title="Could not load promos"
      message={error instanceof Error ? error.message : 'Unexpected error.'}
      onRetry={reset}
    />
  ),
})

type Filter = 'all' | 'active' | 'expired' | 'exhausted' | 'inactive'
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'exhausted', label: 'Exhausted' },
  { key: 'inactive', label: 'Inactive' },
]

function formatDate(d: Date | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDiscount(row: AdminPromoListRow): string {
  if (row.discountType === 'percent') return `${row.discountValueSen}%`
  return `RM ${(row.discountValueSen / 100).toFixed(2)}`
}

function AdminPromosPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<AdminPromoListResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState<AdminPromoListRow | null>(null)

  async function load(p = page) {
    setLoading(true)
    setError(null)
    try {
      const res = await listPromos({
        data: {
          page: p,
          pageSize: 25,
          filter,
          search: search || undefined,
        },
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load promos.')
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
    <AdminSidebarShell user={session.user} pageTitle="Promo codes">
      <PageHeader
        title="Promo codes"
        description="Create, edit, and audit discount codes."
        actions={
          <>
            <button
              type="button"
              className="button-secondary inline-flex items-center gap-1.5"
              onClick={() => setBulkOpen(true)}
            >
              <Sparkles size={14} /> Bulk generate
            </button>
            <button
              type="button"
              className="button-primary inline-flex items-center gap-1.5"
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus size={14} /> New promo
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
            placeholder="Search code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="button-secondary">
            Search
          </button>
        </form>
      </div>

      {error && <ErrorPanel title="Failed to load promos" message={error} onRetry={() => load()} />}
      {loading && !result && <TableSkeleton rows={8} columns={6} />}

      {result && (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Used / Max</th>
                <th>Active</th>
                <th>Schedule</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-sm text-[var(--sea-ink-soft)] py-6">
                    No promos found.
                  </td>
                </tr>
              ) : (
                result.rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        to="/admin/promos/$promoId"
                        params={{ promoId: p.id }}
                        className="plate-link font-mono"
                      >
                        {p.code}
                      </Link>
                    </td>
                    <td className="text-sm">{formatDiscount(p)}</td>
                    <td className="text-sm">
                      {p.redemptionsUsed} / {p.maxRedemptions ?? '∞'}
                    </td>
                    <td>
                      <StatusBadge status={p.isActive ? 'active' : 'inactive'} size="sm" />
                    </td>
                    <td className="text-sm">
                      {formatDate(p.startsAt)} → {formatDate(p.endsAt)}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className={UI_BTN_XS}
                        onClick={() => {
                          setEditing(p)
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

      <PromoFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        onSaved={() => void load()}
      />
      <PromoBulkGenerateSheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onGenerated={() => void load()}
      />
    </AdminSidebarShell>
  )
}
