import { useEffect, useRef, useState } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { DataTable, useSortState, type Column } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu } from '#/components/ui/RowActionsMenu'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { PartnerStatus } from '#/db/schema'
import {
  createPartner,
  deletePartner,
  formatPartnerCode,
  listPartners,
  updatePartner,
  type PartnerListResult,
  type PartnerListRow,
} from '#/lib/partner-functions'
import { requireFullAdminAccess } from '#/lib/route-guards'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 300

export const Route = createFileRoute('/admin/partners/')({
  beforeLoad: async ({ cause }) => {
    const { session } = await requireFullAdminAccess({ cause })
    if (!session) return
    const initialResult = await listPartners({
      data: {
        page: 1,
        pageSize: PAGE_SIZE,
        sortKey: 'name',
        sortDir: 'asc',
      },
    })
    return { session, initialResult }
  },
  component: PartnersPage,
})

type PartnerForm = {
  name: string
  code: string
  contactPerson: string
  phone: string
  email: string
  status: PartnerStatus
  notes: string
}

function emptyForm(): PartnerForm {
  return {
    name: '',
    code: '',
    contactPerson: '',
    phone: '',
    email: '',
    status: 'active',
    notes: '',
  }
}

function partnerToForm(row: PartnerListRow): PartnerForm {
  return {
    name: row.name,
    code: row.code,
    contactPerson: row.contactPerson ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    status: row.status,
    notes: row.notes ?? '',
  }
}

type SortKey = 'name' | 'code' | 'status' | 'createdAt'

function PartnersPage() {
  const navigate = useNavigate()
  const { session, initialResult } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    initialResult: PartnerListResult
  }

  const [result, setResult] = useState<PartnerListResult | null>(initialResult)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | 'all'>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const { sortKey, sortDir, handleSort } = useSortState<SortKey>('name')
  const skipInitialLoad = useRef(Boolean(initialResult))

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PartnerListRow | null>(null)
  const [form, setForm] = useState<PartnerForm>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<PartnerListRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function load(p = page) {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listPartners({
        data: {
          page: p,
          pageSize: PAGE_SIZE,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: search || undefined,
          sortKey,
          sortDir,
        },
      })
      setResult(res)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load partners.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    setPage(1)
    void load(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, sortKey, sortDir])

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim()
      setSearch((prev) => (prev === next ? prev : next))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const activeFilterCount = statusFilter !== 'all' ? 1 : 0
  const hasActiveFilters = activeFilterCount > 0 || searchInput.trim().length > 0

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: PartnerListRow) {
    setEditing(row)
    setForm(partnerToForm(row))
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        code: form.code,
        contactPerson: form.contactPerson || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        status: form.status,
        notes: form.notes || undefined,
      }
      if (editing) {
        await updatePartner({ data: { partnerId: editing.id, ...payload } })
      } else {
        await createPartner({ data: payload })
      }
      setFormOpen(false)
      await load(editing ? page : 1)
      if (!editing) setPage(1)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save partner.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePartner({ data: { partnerId: confirmDelete.id } })
      setConfirmDelete(null)
      await load(page)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<PartnerListRow>[] = [
    {
      key: 'name',
      header: 'Partner',
      sortable: true,
      render: (row) => (
        <Link
          to="/admin/partners/$partnerId"
          params={{ partnerId: row.id }}
          className="plate-link"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs">{formatPartnerCode(row.code)}</span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => (
        <span className="text-sm text-[var(--sea-ink)]">
          {row.contactPerson || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Mobile',
      render: (row) => (
        <span className="text-sm text-[var(--sea-ink-soft)]">{row.phone || '—'}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cellClassName: 'whitespace-normal',
      render: (row) => (
        <span className="text-sm text-[var(--sea-ink-soft)]">{row.email || '—'}</span>
      ),
    },
    {
      key: 'models',
      header: 'Models (units)',
      cellClassName: 'whitespace-normal align-top',
      render: (row) =>
        row.modelLines.length === 0 ? (
          <span className="text-sm text-[var(--sea-ink-soft)]">—</span>
        ) : (
          <div className="partner-models-cell">
            {row.modelLines.map((line) => (
              <div
                key={`${line.make}-${line.model}-${line.maxUnits}`}
                className="partner-models-cell__line"
              >
                <span className="partner-models-cell__name">
                  {line.make} {line.model}
                </span>
                <span className="partner-models-cell__capacity">{line.maxUnits}</span>
              </div>
            ))}
          </div>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <RowActionsMenu
          label={`Actions for ${row.name}`}
          actions={[
            {
              label: 'Edit',
              icon: <Pencil />,
              onSelect: () => openEdit(row),
            },
            {
              label: 'Delete',
              variant: 'destructive',
              separatorBefore: true,
              icon: <Trash2 />,
              onSelect: () => setConfirmDelete(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <AdminSidebarShell user={session.user} pageTitle="Partners">
      <PageHeader
        kicker="Fleet supply"
        title="Partners"
        description={
          result
            ? `${result.total.toLocaleString()} partner${result.total !== 1 ? 's' : ''}`
            : 'Loading…'
        }
        actions={
          <button type="button" className="button-primary flex items-center gap-2" onClick={openAdd}>
            <Plus size={15} />
            Add partner
          </button>
        }
      />

      {loadError ? (
        <ErrorPanel title="Failed to load partners" message={loadError} onRetry={() => load()} />
      ) : null}

      {loading && !result ? <TableSkeleton rows={6} columns={5} /> : null}

      {result ? (
        <div className="space-y-3">
          <article className="workspace-panel island-shell overflow-x-auto p-0">
            <AdminListFilterBar
              searchValue={searchInput}
              onSearchChange={setSearchInput}
              onSearchClear={() => setSearch('')}
              searchPlaceholder="Name, code, email…"
              searchAriaLabel="Search partners"
              filtersOpen={filtersOpen}
              onFiltersOpenChange={setFiltersOpen}
              activeFilterCount={activeFilterCount}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={() => {
                setStatusFilter('all')
                setSearchInput('')
                setSearch('')
              }}
            >
              <StatusFilterSelect
                aria-label="Filter partners by status"
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                onValueChange={setStatusFilter}
              />
            </AdminListFilterBar>

            <DataTable
              columns={columns}
              data={result.rows}
              getKey={(row) => row.id}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort as (key: string) => void}
              onRowClick={(row) =>
                void navigate({
                  to: '/admin/partners/$partnerId',
                  params: { partnerId: row.id },
                })
              }
              emptyState={
                <div className="hub-empty-state m-6">
                  <p className="text-sm text-[var(--sea-ink-soft)]">
                    {hasActiveFilters ? 'No partners match these filters.' : 'No partners yet.'}
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
      ) : null}

      <Sheet open={formOpen} onOpenChange={(open) => { if (!open) setFormOpen(false) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pt-5 pb-4">
            <p className="island-kicker mb-1">{editing ? 'Edit partner' : 'New partner'}</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {editing ? editing.name : 'Add fleet partner'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form
              id="partner-form"
              className="admin-form-sheet fleet-car-form space-y-5"
              onSubmit={handleSubmit}
            >
              <section className="fleet-car-form__section">
                <span className="ui-label">Identity</span>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="pf-name">Name</label>
                    <input
                      id="pf-name"
                      className="field-input"
                      required
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Island Motors"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="pf-code">Code</label>
                    <input
                      id="pf-code"
                      className="field-input font-mono"
                      required
                      value={form.code}
                      onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="e.g. island-motors"
                    />
                  </div>
                </div>
              </section>

              <section className="fleet-car-form__section">
                <span className="ui-label">Contact</span>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="field-label" htmlFor="pf-contact">Contact person</label>
                    <input
                      id="pf-contact"
                      className="field-input"
                      value={form.contactPerson}
                      onChange={(e) => setForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="e.g. Ahmad Razif"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label" htmlFor="pf-phone">Phone</label>
                      <input
                        id="pf-phone"
                        className="field-input"
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. 016-770 7097"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="pf-email">Email</label>
                      <input
                        id="pf-email"
                        type="email"
                        className="field-input"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="e.g. ops@island.com"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="fleet-car-form__section">
                <span className="ui-label">Account</span>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="field-label" htmlFor="pf-status">Status</label>
                    <select
                      id="pf-status"
                      className="field-input"
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, status: e.target.value as PartnerStatus }))
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="pf-notes">Notes</label>
                    <textarea
                      id="pf-notes"
                      className="field-input"
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Internal notes about this partner…"
                    />
                  </div>
                </div>
              </section>

              {formError ? <p className="form-error">{formError}</p> : null}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="partner-form" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add partner'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={confirmDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(null)
            setDeleteError(null)
          }
        }}
        title={confirmDelete ? `Delete ${confirmDelete.name}?` : 'Delete partner?'}
        description={
          confirmDelete ? (
            <>
              This removes the partner and all of their car models.
              {deleteError ? (
                <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
              ) : null}
            </>
          ) : null
        }
        confirmLabel="Delete partner"
        confirming={deleting}
        onConfirm={handleDelete}
      />
    </AdminSidebarShell>
  )
}
