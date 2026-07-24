import { useState } from 'react'

import { Pencil, Trash2 } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { PageHeader } from '#/components/ui/PageHeader'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { deleteCustomer, updateCustomer } from '#/lib/customer-functions'
import type { CustomerRow } from './CustomersList'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Form state ───────────────────────────────────────────────────────────────

type CustomerFormData = {
  fullName: string
  icOrPassport: string
  phone: string
  email: string
  address: string
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

// ─── Props ────────────────────────────────────────────────────────────────────

type CustomerProfileProps = {
  initialCustomer: CustomerRow
  session: { user: { name: string; email: string; role: string } }
  listPath: string
  canDelete: boolean
  onDeleted?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerProfile({
  initialCustomer,
  session,
  listPath,
  canDelete,
  onDeleted,
}: CustomerProfileProps) {
  const [customer, setCustomer] = useState<CustomerRow>(initialCustomer)

  // Edit sheet
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>(rowToForm(customer))
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  function openEdit() {
    setFormData(rowToForm(customer))
    setFormError(null)
    setEditOpen(true)
  }

  function setField<K extends keyof CustomerFormData>(key: K, value: CustomerFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const updated = await updateCustomer({
        data: {
          customerId: customer.id,
          fullName: formData.fullName,
          icOrPassport: formData.icOrPassport,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
        },
      })
      setCustomer(updated as CustomerRow)
      setEditOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteConfirm() {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteCustomer({ data: { customerId: customer.id } })
      onDeleted?.()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle="Customer profile">
      <PageHeader
        variant="detail"
        backLink={{ to: listPath, label: 'Back to customers' }}
        title={customer.fullName ?? '—'}
        description={
          <>
            <span className="island-kicker">Customer profile</span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span className="font-mono text-xs font-semibold text-[var(--lagoon-deep)]">
              {customer.icOrPassport ?? '—'}
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="button-secondary inline-flex items-center gap-1.5"
              onClick={openEdit}
            >
              <Pencil size={13} />
              Edit
            </button>
            {canDelete && (
              <button
                type="button"
                className="button-danger inline-flex items-center gap-1.5"
                onClick={() => {
                  setConfirmDelete(true)
                  setDeleteError(null)
                }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        }
      />

      {/* Detail grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription className="island-kicker">Customer details</CardDescription>
            <CardTitle className="sr-only">Customer details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3">
              {[
                { label: 'Full name', value: customer.fullName },
                { label: 'IC / Passport', value: customer.icOrPassport },
                { label: 'Phone', value: customer.phone },
                { label: 'Email', value: customer.email },
                {
                  label: 'Address',
                  value: customer.address
                    ? customer.address.split('\n').map((line, i) => (
                        <span key={i} className="block">{line}</span>
                      ))
                    : null,
                },
                { label: 'Customer since', value: formatDate(customer.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="summary-row">
                  <dt className="text-sm text-[var(--sea-ink-soft)]">{label}</dt>
                  <dd className="text-sm font-medium text-[var(--sea-ink)]">
                    {value ?? <span className="font-normal opacity-40">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription className="island-kicker">Rental history</CardDescription>
            <CardTitle className="sr-only">Rental history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="hub-empty-state">
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Rental history will appear here once Stage 4 is complete.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Sheet ── */}
      <Sheet open={editOpen} onOpenChange={(open) => { if (!open) setEditOpen(false) }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Edit customer</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              {customer.fullName ?? 'Customer'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="customer-edit-form" className="space-y-3" onSubmit={handleFormSubmit}>
              <div>
                <label className="field-label" htmlFor="cep-name">Full name</label>
                <input
                  id="cep-name"
                  type="text"
                  className="field-input"
                  value={formData.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cep-ic">IC / Passport number</label>
                <input
                  id="cep-ic"
                  type="text"
                  className="field-input font-mono"
                  value={formData.icOrPassport}
                  onChange={(e) => setField('icOrPassport', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cep-phone">Phone number</label>
                <input
                  id="cep-phone"
                  type="tel"
                  className="field-input"
                  value={formData.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cep-email">
                  Email <span className="ml-1 font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <input
                  id="cep-email"
                  type="email"
                  className="field-input"
                  value={formData.email}
                  onChange={(e) => setField('email', e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="cep-address">
                  Address <span className="ml-1 font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                </label>
                <textarea
                  id="cep-address"
                  className="field-input"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setField('address', e.target.value)}
                />
              </div>

              {formError && <p className="form-error">{formError}</p>}
            </form>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="customer-edit-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Confirm delete ── */}
      <ConfirmActionDialog
        open={canDelete && confirmDelete}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(false)
            setDeleteError(null)
          }
        }}
        title={`Delete ${customer.fullName ?? 'this customer'}?`}
        description={
          <>
            This will permanently remove{' '}
            <strong>{customer.fullName ?? 'this customer'}</strong> and all their associated
            data. This action cannot be undone.
            {deleteError ? (
              <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
            ) : null}
          </>
        }
        confirmLabel="Delete customer"
        confirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </AdminSidebarShell>
  )
}
