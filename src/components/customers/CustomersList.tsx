import { useState, useMemo } from 'react'

import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react'

import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { PageHeader } from '#/components/ui/PageHeader'
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
  updateCustomer,
} from '#/lib/customer-functions'

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

function sortCustomers(rows: CustomerRow[], key: SortKey, dir: 'asc' | 'desc'): CustomerRow[] {
  return [...rows].sort((a, b) => {
    const av = key === 'createdAt' ? a.createdAt.getTime() : (a[key] ?? '')
    const bv = key === 'createdAt' ? b.createdAt.getTime() : (b[key] ?? '')
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv))
    return dir === 'asc' ? cmp : -cmp
  })
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Row button ───────────────────────────────────────────────────────────────

const ROW_BTN =
  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink)] shadow-[0_1px_3px_rgba(30,90,72,0.08)] hover:-translate-y-px transition-transform cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'

// ─── Props ────────────────────────────────────────────────────────────────────

type CustomersListProps = {
  initialCustomers: CustomerRow[]
  session: { user: { name: string; email: string; role: string } }
  basePath: string
  canDelete: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomersList({
  initialCustomers,
  session,
  basePath,
  canDelete,
}: CustomersListProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>(initialCustomers)
  const [search, setSearch] = useState('')
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

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? customers.filter(
          (c) =>
            (c.fullName ?? '').toLowerCase().includes(q) ||
            (c.icOrPassport ?? '').toLowerCase().includes(q) ||
            (c.phone ?? '').toLowerCase().includes(q),
        )
      : customers
    return sortCustomers(filtered, sortKey, sortDir)
  }, [customers, search, sortKey, sortDir])

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

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      if (editingCustomer) {
        const updated = await updateCustomer({
          data: {
            customerId: editingCustomer.id,
            fullName: formData.fullName,
            icOrPassport: formData.icOrPassport,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
          },
        })
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated!.id ? (updated as CustomerRow) : c)),
        )
      } else {
        const created = await createCustomer({
          data: {
            fullName: formData.fullName,
            icOrPassport: formData.icOrPassport,
            phone: formData.phone,
            email: formData.email || undefined,
            address: formData.address || undefined,
          },
        })
        setCustomers((prev) => [created as CustomerRow, ...prev])
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
      setCustomers((prev) => prev.filter((c) => c.id !== confirmingDelete.id))
      setConfirmingDelete(null)
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
        <>
          <button type="button" className={`${ROW_BTN} mr-1.5`} onClick={() => openEdit(c)}>
            <Pencil size={11} />
            Edit
          </button>
          {canDelete && (
            <button
              type="button"
              className={`${ROW_BTN} opacity-60 hover:opacity-100`}
              onClick={() => {
                setConfirmingDelete(c)
                setDeleteError(null)
              }}
            >
              <Trash2 size={11} />
              Delete
            </button>
          )}
        </>
      ),
    },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Customers">
      {/* Page header */}
      <PageHeader
        title="Customers"
        description={`${customers.length} customer${customers.length !== 1 ? 's' : ''} total`}
        actions={
          <button type="button" className="button-primary flex items-center gap-2" onClick={openAdd}>
            <Plus size={15} />
            Add customer
          </button>
        }
      />

      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
          />
          <input
            type="search"
            className="field-input pl-8"
            placeholder="Search name, IC, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <span className="text-xs text-[var(--sea-ink-soft)]">
            {filteredSorted.length} result{filteredSorted.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <DataTable
          columns={columns}
          data={filteredSorted}
          getKey={(c) => c.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort as (key: string) => void}
          emptyState={
            <div className="hub-empty-state m-6">
              <Users size={28} className="text-[var(--sea-ink-soft)]" />
              <p className="text-sm text-[var(--sea-ink-soft)]">
                {search ? 'No customers match your search.' : 'No customers yet.'}
              </p>
            </div>
          }
        />
      </article>

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

      {/* ── Confirm delete overlay ── */}
      {canDelete && confirmingDelete && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog island-shell">
            <p className="island-kicker mb-2">Delete customer</p>
            <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              Delete {confirmingDelete.fullName ?? 'this customer'}?
            </h3>
            <p className="mb-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
              This will permanently remove{' '}
              <strong>{confirmingDelete.fullName ?? 'this customer'}</strong> and all their
              associated data. This action cannot be undone.
            </p>
            {deleteError && <p className="form-error mb-4">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                className="button-danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Delete customer'}
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => {
                  setConfirmingDelete(null)
                  setDeleteError(null)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSidebarShell>
  )
}
