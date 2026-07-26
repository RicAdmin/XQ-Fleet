import { useEffect, useMemo, useState } from 'react'

import { Plus } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import {
  listPickupLocations,
  savePickupLocation,
  type PickupLocationRow,
} from '#/lib/location-functions'

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

type LocationForm = {
  id?: string
  code: string
  label: string
  kind: PickupLocationRow['kind']
  deliveryFeeRM: string
  isActive: boolean
  sortOrder: string
  notes: string
}

function emptyForm(): LocationForm {
  return {
    code: '',
    label: '',
    kind: 'custom',
    deliveryFeeRM: '0',
    isActive: true,
    sortOrder: '0',
    notes: '',
  }
}

type AdminLocationsProps = {
  session: { user: { name: string; email: string; role: string } }
}

export default function AdminLocations({ session }: AdminLocationsProps) {
  const [rows, setRows] = useState<PickupLocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<LocationForm>(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setRows(await listPickupLocations())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  function openCreate() {
    setForm(emptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: PickupLocationRow) {
    setForm({
      id: row.id,
      code: row.code,
      label: row.label,
      kind: row.kind as LocationForm['kind'],
      deliveryFeeRM: (row.deliveryFeeSen / 100).toFixed(2),
      isActive: row.isActive,
      sortOrder: String(row.sortOrder),
      notes: row.notes ?? '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      await savePickupLocation({
        data: {
          id: form.id,
          code: form.code,
          label: form.label,
          kind: form.kind,
          deliveryFeeSen: Math.round(Number(form.deliveryFeeRM || '0') * 100),
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder || '0'),
          notes: form.notes || undefined,
        },
      })
      setFormOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save location.')
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo<Column<PickupLocationRow>[]>(
    () => [
      { key: 'label', header: 'Location', render: (row) => row.label },
      { key: 'code', header: 'Code', render: (row) => row.code },
      { key: 'kind', header: 'Type', render: (row) => row.kind },
      {
        key: 'fee',
        header: 'Add-on fee',
        render: (row) => formatMYR(row.deliveryFeeSen),
      },
      {
        key: 'active',
        header: 'Active',
        render: (row) => (row.isActive ? 'Yes' : 'No'),
      },
    ],
    [],
  )

  return (
    <AdminSidebarShell user={session.user} pageTitle="Locations">
      <PageHeader
        title="Location"
        description="Pickup and return locations with optional delivery add-on fees."
        actions={
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus size={15} />
            Add location
          </Button>
        }
      />

      {error ? (
        <ErrorPanel title="Could not load locations" message={error} onRetry={load} />
      ) : null}

      <article className="workspace-panel island-shell overflow-x-auto p-0">
        <DataTable
          columns={columns}
          data={rows}
          getKey={(row) => row.id}
          onRowClick={openEdit}
          emptyState={
            <div className="p-6 text-center text-sm text-muted-foreground">
              {loading ? 'Loading…' : 'No locations configured yet.'}
            </div>
          }
        />
      </article>

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <SheetTitle>{form.id ? 'Edit location' : 'Add location'}</SheetTitle>
          </SheetHeader>
          <form
            id="location-form"
            className="flex-1 space-y-4 overflow-y-auto px-5 py-4"
            onSubmit={handleSave}
          >
            <div>
              <label className="field-label" htmlFor="loc-label">
                Label
              </label>
              <input
                id="loc-label"
                className="field-input"
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="loc-code">
                Code
              </label>
              <input
                id="loc-code"
                className="field-input"
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="loc-kind">
                Type
              </label>
              <select
                id="loc-kind"
                className="field-input"
                value={form.kind}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    kind: e.target.value as LocationForm['kind'],
                  }))
                }
              >
                <option value="office">Office</option>
                <option value="airport">Airport</option>
                <option value="jetty">Jetty</option>
                <option value="hotel">Hotel</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="loc-fee">
                Delivery add-on (RM)
              </label>
              <input
                id="loc-fee"
                type="number"
                min={0}
                step="0.01"
                className="field-input"
                value={form.deliveryFeeRM}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, deliveryFeeRM: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="field-label" htmlFor="loc-sort">
                Sort order
              </label>
              <input
                id="loc-sort"
                type="number"
                min={0}
                className="field-input"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              />
              Active
            </label>
            {formError ? <p className="form-error">{formError}</p> : null}
          </form>
          <SheetFooter className="border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="location-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save location'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminSidebarShell>
  )
}
