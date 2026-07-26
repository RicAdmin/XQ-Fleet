import { useState } from 'react'

import { createFileRoute, notFound } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { DataTable, type Column } from '#/components/ui/DataTable'
import { PageHeader } from '#/components/ui/PageHeader'
import { RowActionsMenu } from '#/components/ui/RowActionsMenu'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { CarCategory } from '#/db/schema'
import {
  createPartnerCarModel,
  deletePartnerCarModel,
  formatPartnerCode,
  getPartnerDetail,
  listCarsForPartnerLink,
  updatePartner,
  updatePartnerCarModel,
  type PartnerDetail,
  type PartnerModelRow,
} from '#/lib/partner-functions'
import { requireFullAdminAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/admin/partners/$partnerId')({
  beforeLoad: async ({ params, cause }) => {
    const { session } = await requireFullAdminAccess({ cause })
    if (!session) return
    const detail = await getPartnerDetail({ data: { partnerId: params.partnerId } })
    if (!detail) throw notFound()
    return { detail }
  },
  component: PartnerDetailPage,
})

const CATEGORY_OPTIONS: { value: CarCategory; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'mpv', label: 'MPV' },
  { value: 'suv', label: 'SUV' },
  { value: 'other', label: 'Other' },
]

type ModelForm = {
  make: string
  model: string
  category: CarCategory
  yearFrom: string
  yearTo: string
  maxUnits: string
  wholesaleDailyRM: string
  leadTimeHours: string
  linkedCarId: string
  isActive: boolean
  notes: string
}

function emptyModelForm(): ModelForm {
  return {
    make: '',
    model: '',
    category: 'economy',
    yearFrom: '',
    yearTo: '',
    maxUnits: '1',
    wholesaleDailyRM: '',
    leadTimeHours: '',
    linkedCarId: '',
    isActive: true,
    notes: '',
  }
}

function modelToForm(row: PartnerModelRow): ModelForm {
  return {
    make: row.make,
    model: row.model,
    category: row.category,
    yearFrom: row.yearFrom != null ? String(row.yearFrom) : '',
    yearTo: row.yearTo != null ? String(row.yearTo) : '',
    maxUnits: String(row.maxUnits),
    wholesaleDailyRM:
      row.wholesaleDailySen != null ? (row.wholesaleDailySen / 100).toFixed(2) : '',
    leadTimeHours: row.leadTimeHours != null ? String(row.leadTimeHours) : '',
    linkedCarId: row.linkedCarId ?? '',
    isActive: row.isActive,
    notes: row.notes ?? '',
  }
}

function PartnerDetailPage() {
  const { session, detail: initialDetail } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    detail: PartnerDetail
  }

  const [detail, setDetail] = useState(initialDetail)
  const [partnerNotes, setPartnerNotes] = useState(initialDetail.partner.notes ?? '')
  const [partnerStatus, setPartnerStatus] = useState(initialDetail.partner.status)
  const [partnerSaving, setPartnerSaving] = useState(false)
  const [partnerError, setPartnerError] = useState<string | null>(null)

  const [cars, setCars] = useState<
    Awaited<ReturnType<typeof listCarsForPartnerLink>>
  >([])
  const [carsLoaded, setCarsLoaded] = useState(false)
  const [modelOpen, setModelOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<PartnerModelRow | null>(null)
  const [modelForm, setModelForm] = useState<ModelForm>(emptyModelForm())
  const [modelError, setModelError] = useState<string | null>(null)
  const [modelSaving, setModelSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<PartnerModelRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function ensureCarsLoaded() {
    if (carsLoaded) return
    try {
      const rows = await listCarsForPartnerLink()
      setCars(rows)
    } catch {
      setCars([])
    } finally {
      setCarsLoaded(true)
    }
  }

  async function refresh() {
    const next = await getPartnerDetail({
      data: { partnerId: detail.partner.id },
    })
    if (next) setDetail(next)
  }

  async function savePartnerMeta(event: React.FormEvent) {
    event.preventDefault()
    setPartnerSaving(true)
    setPartnerError(null)
    try {
      const updated = await updatePartner({
        data: {
          partnerId: detail.partner.id,
          name: detail.partner.name,
          code: detail.partner.code,
          contactPerson: detail.partner.contactPerson ?? undefined,
          phone: detail.partner.phone ?? undefined,
          email: detail.partner.email ?? undefined,
          status: partnerStatus,
          notes: partnerNotes || undefined,
        },
      })
      setDetail((prev) => ({
        ...prev,
        partner: {
          ...prev.partner,
          status: updated.status,
          notes: updated.notes,
          updatedAt: updated.updatedAt,
        },
      }))
    } catch (err) {
      setPartnerError(err instanceof Error ? err.message : 'Unable to save.')
    } finally {
      setPartnerSaving(false)
    }
  }

  function openAddModel() {
    setEditingModel(null)
    setModelForm(emptyModelForm())
    setModelError(null)
    setModelOpen(true)
    void ensureCarsLoaded()
  }

  function openEditModel(row: PartnerModelRow) {
    setEditingModel(row)
    setModelForm(modelToForm(row))
    setModelError(null)
    setModelOpen(true)
    void ensureCarsLoaded()
  }

  async function handleModelSubmit(event: React.FormEvent) {
    event.preventDefault()
    setModelSaving(true)
    setModelError(null)
    try {
      const payload = {
        make: modelForm.make,
        model: modelForm.model,
        category: modelForm.category,
        yearFrom: modelForm.yearFrom ? Number(modelForm.yearFrom) : null,
        yearTo: modelForm.yearTo ? Number(modelForm.yearTo) : null,
        maxUnits: Number(modelForm.maxUnits) || 1,
        wholesaleDailySen: modelForm.wholesaleDailyRM.trim()
          ? Math.round(Number(modelForm.wholesaleDailyRM) * 100)
          : null,
        leadTimeHours: modelForm.leadTimeHours
          ? Number(modelForm.leadTimeHours)
          : null,
        linkedCarId: modelForm.linkedCarId || null,
        isActive: modelForm.isActive,
        notes: modelForm.notes || undefined,
      }
      if (editingModel) {
        await updatePartnerCarModel({
          data: { modelId: editingModel.id, ...payload },
        })
      } else {
        await createPartnerCarModel({
          data: { partnerId: detail.partner.id, ...payload },
        })
      }
      setModelOpen(false)
      await refresh()
    } catch (err) {
      setModelError(err instanceof Error ? err.message : 'Unable to save model.')
    } finally {
      setModelSaving(false)
    }
  }

  async function handleDeleteModel() {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deletePartnerCarModel({ data: { modelId: confirmDelete.id } })
      setConfirmDelete(null)
      await refresh()
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<PartnerModelRow>[] = [
    {
      key: 'vehicle',
      header: 'Model',
      render: (row) => (
        <span>
          <span className="font-medium">{row.make}</span> {row.model}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => row.category,
    },
    {
      key: 'years',
      header: 'Years',
      render: (row) =>
        row.yearFrom || row.yearTo
          ? `${row.yearFrom ?? '—'}–${row.yearTo ?? '—'}`
          : '—',
    },
    {
      key: 'maxUnits',
      header: 'Max units',
      render: (row) => row.maxUnits,
    },
    {
      key: 'linked',
      header: 'Website listing',
      render: (row) =>
        row.linkedCarLabel ? (
          <span className="text-sm">
            {row.linkedCarLabel}
            {row.linkedCarPlate ? (
              <span className="text-[var(--sea-ink-soft)]"> · {row.linkedCarPlate}</span>
            ) : null}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.isActive ? 'active' : 'inactive'} size="sm" />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <RowActionsMenu
          label={`Actions for ${row.make} ${row.model}`}
          actions={[
            { label: 'Edit', icon: <Pencil />, onSelect: () => openEditModel(row) },
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

  const partner = detail.partner

  return (
    <AdminSidebarShell user={session.user} pageTitle="Partner">
      <PageHeader
        variant="detail"
        backLink={{ to: '/admin/partners', label: 'Back' }}
        title={partner.name}
        description={
          <>
            <span className="font-mono text-xs">{formatPartnerCode(partner.code)}</span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <StatusBadge status={partner.status} size="sm" />
          </>
        }
        actions={
          <button
            type="button"
            className="button-primary flex items-center gap-2"
            onClick={openAddModel}
          >
            <Plus size={15} />
            Add car model
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardDescription className="island-kicker">Partner</CardDescription>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="mb-4 flex flex-col gap-2 text-sm">
              <div className="summary-row">
                <dt className="text-[var(--sea-ink-soft)]">Contact</dt>
                <dd>{partner.contactPerson || '—'}</dd>
              </div>
              <div className="summary-row">
                <dt className="text-[var(--sea-ink-soft)]">Phone</dt>
                <dd>{partner.phone || '—'}</dd>
              </div>
              <div className="summary-row">
                <dt className="text-[var(--sea-ink-soft)]">Email</dt>
                <dd>{partner.email || '—'}</dd>
              </div>
            </dl>
            <form className="space-y-3" onSubmit={savePartnerMeta}>
              <div>
                <label className="field-label" htmlFor="pd-status">Status</label>
                <select
                  id="pd-status"
                  className="field-input"
                  value={partnerStatus}
                  onChange={(e) =>
                    setPartnerStatus(e.target.value as typeof partnerStatus)
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="pd-notes">Notes</label>
                <textarea
                  id="pd-notes"
                  className="field-input"
                  rows={3}
                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                />
              </div>
              {partnerError ? <p className="form-error">{partnerError}</p> : null}
              <Button type="submit" disabled={partnerSaving}>
                {partnerSaving ? 'Saving…' : 'Save partner'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <article className="workspace-panel island-shell overflow-x-auto p-0 lg:col-span-2">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="island-kicker">Supply</p>
            <h3 className="text-base font-semibold text-[var(--sea-ink)]">
              Car models ({detail.models.length})
            </h3>
          </div>
          <DataTable
            columns={columns}
            data={detail.models}
            getKey={(row) => row.id}
            emptyState={
              <div className="hub-empty-state m-6">
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  No models yet. Add the car types this partner can supply.
                </p>
              </div>
            }
          />
        </article>
      </div>

      <Sheet open={modelOpen} onOpenChange={(open) => { if (!open) setModelOpen(false) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[30rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pt-5 pb-4">
            <p className="island-kicker mb-1">
              {editingModel ? 'Edit model' : 'New model'}
            </p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {editingModel
                ? `${editingModel.make} ${editingModel.model}`
                : 'Partner car model'}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="partner-model-form" className="space-y-3" onSubmit={handleModelSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="pm-make">Make</label>
                  <input
                    id="pm-make"
                    className="field-input"
                    required
                    value={modelForm.make}
                    onChange={(e) =>
                      setModelForm((prev) => ({ ...prev, make: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="pm-model">Model</label>
                  <input
                    id="pm-model"
                    className="field-input"
                    required
                    value={modelForm.model}
                    onChange={(e) =>
                      setModelForm((prev) => ({ ...prev, model: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="pm-category">Category</label>
                <select
                  id="pm-category"
                  className="field-input"
                  value={modelForm.category}
                  onChange={(e) =>
                    setModelForm((prev) => ({
                      ...prev,
                      category: e.target.value as CarCategory,
                    }))
                  }
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="field-label" htmlFor="pm-year-from">Year from</label>
                  <input
                    id="pm-year-from"
                    type="number"
                    className="field-input"
                    value={modelForm.yearFrom}
                    onChange={(e) =>
                      setModelForm((prev) => ({ ...prev, yearFrom: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="pm-year-to">Year to</label>
                  <input
                    id="pm-year-to"
                    type="number"
                    className="field-input"
                    value={modelForm.yearTo}
                    onChange={(e) =>
                      setModelForm((prev) => ({ ...prev, yearTo: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="pm-max">Max units</label>
                  <input
                    id="pm-max"
                    type="number"
                    min={1}
                    className="field-input"
                    required
                    value={modelForm.maxUnits}
                    onChange={(e) =>
                      setModelForm((prev) => ({ ...prev, maxUnits: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="pm-wholesale">
                    Wholesale daily (RM)
                  </label>
                  <input
                    id="pm-wholesale"
                    type="number"
                    min={0}
                    step={0.01}
                    className="field-input"
                    value={modelForm.wholesaleDailyRM}
                    onChange={(e) =>
                      setModelForm((prev) => ({
                        ...prev,
                        wholesaleDailyRM: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="pm-lead">Lead time (hours)</label>
                  <input
                    id="pm-lead"
                    type="number"
                    min={0}
                    className="field-input"
                    value={modelForm.leadTimeHours}
                    onChange={(e) =>
                      setModelForm((prev) => ({
                        ...prev,
                        leadTimeHours: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="pm-linked">
                  Link to website vehicle
                </label>
                <select
                  id="pm-linked"
                  className="field-input"
                  value={modelForm.linkedCarId}
                  onChange={(e) =>
                    setModelForm((prev) => ({ ...prev, linkedCarId: e.target.value }))
                  }
                >
                  <option value="">None</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.make} {car.model} · {car.plateNumber}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={modelForm.isActive}
                  onChange={(e) =>
                    setModelForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                />
                Active supply
              </label>
              <div>
                <label className="field-label" htmlFor="pm-notes">Notes</label>
                <textarea
                  id="pm-notes"
                  className="field-input"
                  rows={2}
                  value={modelForm.notes}
                  onChange={(e) =>
                    setModelForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
              {modelError ? <p className="form-error">{modelError}</p> : null}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="partner-model-form" disabled={modelSaving}>
              {modelSaving ? 'Saving…' : editingModel ? 'Save changes' : 'Add model'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setModelOpen(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        open={confirmDelete != null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
        title={
          confirmDelete
            ? `Remove ${confirmDelete.make} ${confirmDelete.model}?`
            : 'Remove model?'
        }
        description="This removes the model from this partner’s supply list."
        confirmLabel="Remove model"
        confirming={deleting}
        onConfirm={handleDeleteModel}
      />
    </AdminSidebarShell>
  )
}
