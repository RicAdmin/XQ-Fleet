import { useEffect, useRef, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Users } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu } from '#/components/ui/RowActionsMenu'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  createCustomer,
  deleteCustomer,
  getCustomerAccountCounts,
  listCustomers,
  updateCustomer,
  type CustomerListResult,
} from '#/lib/customer-functions'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

// ─── Types ────────────────────────────────────────────────────────────────────

export type CustomerRow = {
  id: string
  authUserId: string | null
  fullName: string | null
  email: string | null
  icOrPassport: string | null
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}

type CustomerFormData = {
  fullName: string
  icOrPassport: string
  phone: string
  email: string
  address: string
}

type SortKey = 'fullName' | 'icOrPassport' | 'phone' | 'email' | 'createdAt'
type AccountFilter = 'all' | 'linked' | 'walk-in'

const ACCOUNT_FILTER_OPTIONS: { value: AccountFilter; label: string }[] = [
  { value: 'all', label: 'All customers' },
  { value: 'linked', label: 'Linked account' },
  { value: 'walk-in', label: 'In House' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyForm(): CustomerFormData {
  return { fullName: '', icOrPassport: '', phone: '', email: '', address: '' }
}

function rowToForm(c: CustomerRow): CustomerFormData {
  return {
    fullName: c.fullName ?? '',
    icOrPassport: c.icOrPassport ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    address: c.address ?? '',
  }
}

function formatDate(d: Date | string) {
  const date = d instanceof Date ? d : new Date(String(d))
  return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

type CustomersListProps = {
  session: { user: { name: string; email: string; role: string } }
  basePath: string
  canDelete: boolean
  initialResult?: CustomerListResult
  initialAccountCounts?: Record<'all' | 'linked' | 'walk-in', number>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomersList({
  session,
  basePath,
  canDelete,
  initialResult,
  initialAccountCounts,
}: CustomersListProps) {
  const skipInitialLoad = useRef(Boolean(initialResult))
  const [result, setResult] = useState<CustomerListResult | null>(initialResult ?? null)
  const [accountCounts, setAccountCounts] = useState<
    Record<'all' | 'linked' | 'walk-in', number>
  >(initialAccountCounts ?? { all: 0, linked: 0, 'walk-in': 0 })
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>('createdAt', 'desc')

  // Form
  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirm
  const [confirmingDelete, setConfirmingDelete] = useState<CustomerRow | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load(p = page) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listCustomers({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          accountFilter,
          search: search || undefined,
          sortKey,
          sortDir,
        },
      })
      setResult(res)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load customers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialAccountCounts) return
    void getCustomerAccountCounts()
      .then(setAccountCounts)
      .catch(() => {
        // Non-blocking tab counts.
      })
  }, [initialAccountCounts])

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    setPage(1)
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter, search, sortKey, sortDir])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => (prev === next ? prev : next))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const activeFilterCount = accountFilter !== 'all' ? 1 : 0
  const hasActiveFilters =
    accountFilter !== 'all' || searchInput.trim().length > 0 || search.length > 0

  // ── Form handlers ─────────────────────────────────────────────────────────

  function openAdd() {
    setEditingCustomer(null)
    setFormData(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(c: CustomerRow) {
    setEditingCustomer(c)
    setFormData(rowToForm(c))
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingCustomer(null)
    setFormError(null)
  }

  function setField<K extends keyof CustomerFormData>(key: K, value: CustomerFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function refreshAccountCounts() {
    try {
      setAccountCounts(await getCustomerAccountCounts())
    } catch {
      // Non-blocking tab counts.
    }
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      if (editingCustomer) {
        await updateCustomer({
          data: {
            customerId: editingCustomer.id,
            fullName: formData.fullName,
            icOrPassport: formData.icOrPassport,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
          },
        })
        await load(page)
      } else {
        await createCustomer({
          data: {
            fullName: formData.fullName,
            icOrPassport: formData.icOrPassport,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
          },
        })
        setPage(1)
        await Promise.all([load(1), refreshAccountCounts()])
      }
      closeForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete handler ────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!confirmingDelete) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteCustomer({ data: { customerId: confirmingDelete.id } })
      setConfirmingDelete(null)
      await Promise.all([load(page), refreshAccountCounts()])
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: Column<CustomerRow>[] = [
    {
      key: 'fullName',
      header: 'Name',
      sortable: true,
      render: (c) => (
        <Link to={`${basePath}/$customerId` as never} params={{ customerId: c.id } as never} className="plate-link">
          {c.fullName ?? '—'}
        </Link>
      ),
    },
    {
      key: 'icOrPassport',
      header: 'IC / Passport',
      sortable: true,
      cellClassName: 'font-mono text-xs text-[var(--sea-ink-soft)]',
      render: (c) => c.icOrPassport ?? '—',
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      cellClassName: 'text-[var(--sea-ink-soft)]',
      render: (c) => c.phone ?? '—',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      cellClassName: 'text-[var(--sea-ink-soft)]',
      render: (c) => c.email ?? <span className="opacity-40">—</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      cellClassName: 'text-[var(--sea-ink-soft)]',
      render: (c) => formatDate(c.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right whitespace-nowrap',
      render: (c) => (
        <RowActionsMenu
          label={`Actions for ${c.fullName ?? 'customer'}`}
          actions={[
            { label: 'Edit', icon: <Pencil />, onSelect: () => openEdit(c) },
            ...(canDelete
              ? [
                  {
                    label: 'Delete',
                    variant: 'destructive' as const,
                    separatorBefore: true,
                    onSelect: () => {
                      setConfirmingDelete(c)
                      setDeleteError(null)
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Customers">
      {/* Page header */}
      <PageHeader
        kicker="Customer records"
        title="Customers"
        description={
          result
            ? `${result.total.toLocaleString()} customer${result.total !== 1 ? 's' : ''} total`
            : 'Loading…'
        }
        actions={
          <button type="button" className="button-primary flex items-center gap-2" onClick={openAdd}>
            <Plus size={15} />
            Add customer
          </button>
        }
      />

      {loadError && (
        <ErrorPanel title="Failed to load customers" message={loadError} onRetry={() => load()} />
      )}

      {loading && !result && <TableSkeleton rows={8} columns={6} />}

      {result && (
      <div className="admin-stack">
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <AdminListFilterBar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchClear={() => setSearch('')}
          searchPlaceholder="Name, IC, phone, email…"
          searchAriaLabel="Search customers"
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setAccountFilter('all')
            setSearchInput('')
            setSearch('')
          }}
        >
          <StatusFilterSelect
            aria-label="Filter customers by account"
            value={accountFilter}
            options={ACCOUNT_FILTER_OPTIONS.map((opt) => ({
              value: opt.value,
              label: `${opt.label} (${accountCounts[opt.value]})`,
            }))}
            onValueChange={setAccountFilter}
          />
        </AdminListFilterBar>

        <DataTable
          columns={columns}
          data={result.rows}
          getKey={(c) => c.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort as (key: string) => void}
          emptyState={
            <div className="hub-empty-state m-6">
              <Users size={28} className="text-[var(--sea-ink-soft)]" />
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {hasActiveFilters ? 'No customers match your filter.' : 'No customers yet.'}
              </p>
            </div>
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

      {/* ── Add / Edit Sheet ── */}
      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) closeForm() }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">
              {editingCustomer ? 'Edit customer' : 'New customer'}
            </p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {editingCustomer ? (editingCustomer.fullName ?? 'Customer') : 'Add customer'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="customer-form" className="space-y-3" onSubmit={handleFormSubmit}>
              <div>
                <label className="field-label" htmlFor="cuf-name">Full name</label>
                <input
                  id="cuf-name"
                  type="text"
                  className="field-input"
                  value={formData.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="e.g. Ahmad bin Abdullah"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cuf-ic">IC / Passport number</label>
                <input
                  id="cuf-ic"
                  type="text"
                  className="field-input font-mono"
                  value={formData.icOrPassport}
                  onChange={(e) => setField('icOrPassport', e.target.value)}
                  placeholder="e.g. 900101-01-1234"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cuf-phone">Phone number</label>
                <input
                  id="cuf-phone"
                  type="tel"
                  className="field-input"
                  value={formData.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="e.g. 011-1234 5678"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cuf-email">
                  Email <span className="ml-1 font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <input
                  id="cuf-email"
                  type="email"
                  className="field-input"
                  value={formData.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="e.g. ahmad@email.com"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cuf-address">
                  Address <span className="ml-1 font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <textarea
                  id="cuf-address"
                  className="field-input"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setField('address', e.target.value)}
                  placeholder="Street, city, postcode…"
                />
              </div>

              {formError && <p className="form-error">{formError}</p>}
            </form>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="customer-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : editingCustomer ? 'Save changes' : 'Add customer'}
            </Button>
            <Button variant="outline" type="button" onClick={closeForm}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Confirm delete ── */}
      <ConfirmActionDialog
        open={canDelete && confirmingDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDelete(null)
            setDeleteError(null)
          }
        }}
        title={
          confirmingDelete
            ? `Delete ${confirmingDelete.fullName ?? 'this customer'}?`
            : 'Delete customer?'
        }
        description={
          confirmingDelete ? (
            <>
              This will permanently remove{' '}
              <strong>{confirmingDelete.fullName ?? 'this customer'}</strong> and all their
              associated data. This action cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Delete customer"
        confirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </AdminSidebarShell>
  )
}
