import { useEffect, useState } from 'react'

import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Pencil, Plus, Sparkles } from 'lucide-react'

import { PromoBulkGenerateSheet } from '#/components/admin/PromoBulkGenerateSheet'
import { PromoFormSheet } from '#/components/admin/PromoFormSheet'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { DataTable, type Column } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu } from '#/components/ui/RowActionsMenu'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { fullAdminRoles, isAppRole } from '#/lib/auth-model'
import type {
  AdminPromoListResult,
  AdminPromoListRow,
} from '#/lib/promo-functions'
import { listPromos } from '#/lib/promo-functions'

export const Route = createFileRoute('/admin/promos/')({
  beforeLoad: ({ context }) => {
    const { session } = context as unknown as {
      session: { user: { role: string; name: string; email: string } } | null
    }
    if (!session || !isAppRole(session.user.role) || !fullAdminRoles.includes(session.user.role)) {
      throw notFound()
    }
  },
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

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'exhausted', label: 'Exhausted' },
  { value: 'inactive', label: 'Inactive' },
]

const SEARCH_DEBOUNCE_MS = 300

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
  const [categoryFilter, setCategoryFilter] = useState<CarCategoryFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
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
          category: categoryFilter === 'all' ? undefined : categoryFilter,
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
  }, [filter, categoryFilter, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => (prev === next ? prev : next))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const activeFilterCount =
    (filter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)
  const hasActiveFilters =
    filter !== 'all' ||
    categoryFilter !== 'all' ||
    searchInput.trim().length > 0 ||
    search.length > 0

  const promoColumns: Column<AdminPromoListRow>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (p) => (
        <Link
          to="/admin/promos/$promoId"
          params={{ promoId: p.id }}
          className="plate-link font-mono"
        >
          {p.code}
        </Link>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (p) => formatDiscount(p),
    },
    {
      key: 'redemptions',
      header: 'Used / Max',
      render: (p) => `${p.redemptionsUsed} / ${p.maxRedemptions ?? '∞'}`,
    },
    {
      key: 'active',
      header: 'Active',
      render: (p) => <StatusBadge status={p.isActive ? 'active' : 'inactive'} size="sm" />,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (p) => `${formatDate(p.startsAt)} → ${formatDate(p.endsAt)}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (p) => (
        <RowActionsMenu
          label={`Actions for ${p.code}`}
          actions={[
            {
              label: 'Edit',
              icon: <Pencil />,
              onSelect: () => {
                setEditing(p)
                setFormOpen(true)
              },
            },
          ]}
        />
      ),
    },
  ]

  return (
    <AdminSidebarShell user={session.user} pageTitle="Promo codes">
      <PageHeader
        kicker="Growth · Promos"
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

      {error && <ErrorPanel title="Failed to load promos" message={error} onRetry={() => load()} />}
      {loading && !result && <TableSkeleton rows={8} columns={6} />}

      {result && (
        <div className="space-y-3">
          <article className="workspace-panel island-shell overflow-x-auto p-0">
            <AdminListFilterBar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchClear={() => setSearch('')}
              searchPlaceholder="Search code…"
              searchAriaLabel="Search promo codes"
              filtersOpen={filtersOpen}
              onFiltersOpenChange={setFiltersOpen}
              activeFilterCount={activeFilterCount}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                setFilter('all')
                setCategoryFilter('all')
                setSearchInput('')
                setSearch('')
              }}
            >
              <StatusFilterSelect
                aria-label="Filter promos by status"
                value={filter}
                options={FILTER_OPTIONS}
                onValueChange={setFilter}
              />
              <StatusFilterSelect
                aria-label="Filter promos by vehicle type"
                value={categoryFilter}
                options={CAR_CATEGORY_FILTER_OPTIONS}
                onValueChange={setCategoryFilter}
              />
            </AdminListFilterBar>

            <DataTable
              columns={promoColumns}
              data={result.rows}
              getKey={(p) => p.id}
              emptyState={
                <p className="text-sm text-[var(--sea-ink-soft)]">No promos found.</p>
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
