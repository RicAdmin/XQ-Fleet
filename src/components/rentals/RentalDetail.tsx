import { useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Trash2 } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import type { RentalFullRow } from '#/lib/rental-functions'
import {
  cancelRental,
  closeReturn,
  confirmHandover,
  deleteRental,
  extendRental,
} from '#/lib/rental-functions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDate(d: Date | null | undefined) {
  if (!d) return '—'
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toDateInput(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── Section: read-only detail grid ──────────────────────────────────────────

function DetailGrid({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs font-medium text-[var(--sea-ink-soft)] uppercase tracking-wide">
            {label}
          </dt>
          <dd className="mt-0.5 text-sm text-[var(--sea-ink)]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
}

function RentalStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Payment badge ────────────────────────────────────────────────────────────

const PAYMENT_STYLES = {
  unpaid: 'bg-red-50 text-red-600 border-red-200',
  partial: 'bg-orange-50 text-orange-600 border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function PaymentBadge({ status }: { status: string }) {
  const style = PAYMENT_STYLES[status as keyof typeof PAYMENT_STYLES] ?? 'bg-slate-100 text-slate-500 border-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type RentalDetailProps = {
  initialRental: RentalFullRow
  session: { user: { name: string; email: string; role: string } }
  listPath: string
  canDelete: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalDetail({
  initialRental,
  session,
  listPath,
  canDelete,
}: RentalDetailProps) {
  const navigate = useNavigate()
  const [rental, setRental] = useState<RentalFullRow>(initialRental)

  // Handover form
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [startMileage, setStartMileage] = useState('')
  const [startCondition, setStartCondition] = useState('')
  const [handoverError, setHandoverError] = useState<string | null>(null)
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false)

  // Return form
  const [returnOpen, setReturnOpen] = useState(false)
  const [endMileage, setEndMileage] = useState('')
  const [endCondition, setEndCondition] = useState('')
  const [paidAmountRM, setPaidAmountRM] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [flagDamage, setFlagDamage] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false)

  // Extend form
  const [extendOpen, setExtendOpen] = useState(false)
  const [newEndDate, setNewEndDate] = useState(() => toDateInput(rental.endDate))
  const [extendError, setExtendError] = useState<string | null>(null)
  const [isSubmittingExtend, setIsSubmittingExtend] = useState(false)

  // Cancel
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Delete
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleHandoverSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHandoverError(null)
    setIsSubmittingHandover(true)
    try {
      const result = await confirmHandover({
        data: {
          rentalId: rental.id,
          startMileage: Number(startMileage),
          startConditionNote: startCondition || undefined,
        },
      })
      setRental((prev) => ({
        ...prev,
        status: result?.status ?? 'active',
        startMileage: result?.startMileage ?? Number(startMileage),
        startConditionNote: result?.startConditionNote ?? (startCondition || null),
      }))
      setHandoverOpen(false)
    } catch (err) {
      setHandoverError(err instanceof Error ? err.message : 'Failed to confirm handover.')
    } finally {
      setIsSubmittingHandover(false)
    }
  }

  async function handleReturnSubmit(e: React.FormEvent) {
    e.preventDefault()
    setReturnError(null)
    setIsSubmittingReturn(true)
    try {
      const result = await closeReturn({
        data: {
          rentalId: rental.id,
          endMileage: Number(endMileage),
          endConditionNote: endCondition || undefined,
          paidAmountSen: Math.round(Number(paidAmountRM) * 100),
          paymentMethod,
          flagDamage,
        },
      })
      setRental((prev) => ({
        ...prev,
        status: result?.status ?? 'closed',
        paymentStatus: result?.paymentStatus ?? prev.paymentStatus,
        endMileage: result?.endMileage ?? Number(endMileage),
        endConditionNote: result?.endConditionNote ?? (endCondition || null),
        paidAmountSen: result?.paidAmountSen ?? Math.round(Number(paidAmountRM) * 100),
        actualReturnDate: result?.actualReturnDate ?? new Date(),
      }))
      setReturnOpen(false)
    } catch (err) {
      setReturnError(err instanceof Error ? err.message : 'Failed to close return.')
    } finally {
      setIsSubmittingReturn(false)
    }
  }

  async function handleExtendSubmit(e: React.FormEvent) {
    e.preventDefault()
    setExtendError(null)
    setIsSubmittingExtend(true)
    try {
      const result = await extendRental({
        data: { rentalId: rental.id, newEndDate },
      })
      setRental((prev) => ({
        ...prev,
        endDate: result?.endDate ?? new Date(newEndDate),
        totalAmountSen: result?.totalAmountSen ?? prev.totalAmountSen,
      }))
      setExtendOpen(false)
    } catch (err) {
      setExtendError(err instanceof Error ? err.message : 'Failed to extend rental.')
    } finally {
      setIsSubmittingExtend(false)
    }
  }

  async function handleCancelConfirm() {
    setCancelError(null)
    setIsCancelling(true)
    try {
      await cancelRental({ data: { rentalId: rental.id } })
      setRental((prev) => ({ ...prev, status: 'cancelled' }))
      setConfirmCancelOpen(false)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel rental.')
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleDeleteConfirm() {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteRental({ data: { rentalId: rental.id } })
      navigate({ to: listPath as never })
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete rental.')
      setIsDeleting(false)
    }
  }

  // ── Core rental info ──────────────────────────────────────────────────────

  const rentalInfo = [
    { label: 'Car', value: <><span className="font-mono font-semibold">{rental.carPlateNumber ?? '—'}</span><span className="ml-1.5 text-xs text-[var(--sea-ink-soft)]">{rental.carMake} {rental.carModel}</span></> },
    { label: 'Customer', value: rental.customerFullName ?? '—' },
    { label: 'IC / Passport', value: rental.customerIcOrPassport ?? '—' },
    { label: 'Phone', value: rental.customerPhone ?? '—' },
    { label: 'Type', value: rental.type === 'walk-in' ? 'Walk-in' : 'Advance booking' },
    { label: 'Start date', value: formatDate(rental.startDate) },
    { label: 'End date', value: formatDate(rental.endDate) },
    { label: 'Daily rate', value: formatMYR(rental.dailyRateSen) },
    { label: 'Total', value: <span className="font-semibold">{formatMYR(rental.totalAmountSen)}</span> },
    { label: 'Deposit', value: formatMYR(rental.depositAmountSen) },
    { label: 'Payment', value: <PaymentBadge status={rental.paymentStatus} /> },
    { label: 'Created', value: formatDate(rental.createdAt) },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminSidebarShell user={session.user} pageTitle="Rental detail">
      {/* Back link */}
      <Link
        to={listPath as never}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] transition-colors"
      >
        <ArrowLeft size={13} />
        All rentals
      </Link>

      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-[var(--sea-ink)]">
            {rental.carPlateNumber ?? 'Rental'} — {rental.customerFullName ?? 'Customer'}
          </h2>
          <RentalStatusBadge status={rental.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Status-driven actions */}
          {rental.status === 'pending' && (
            <>
              <button type="button" className="button-primary text-sm" onClick={() => setHandoverOpen(true)}>
                Confirm handover
              </button>
              <button type="button" className="button-secondary text-sm" onClick={() => { setConfirmCancelOpen(true); setCancelError(null) }}>
                Cancel booking
              </button>
            </>
          )}
          {rental.status === 'active' && (
            <>
              <button type="button" className="button-primary text-sm" onClick={() => { setPaidAmountRM(''); setReturnOpen(true) }}>
                Close return
              </button>
              {session.user.role === 'owner' && (
                <button type="button" className="button-secondary text-sm" onClick={() => { setNewEndDate(toDateInput(rental.endDate)); setExtendOpen(true) }}>
                  Extend rental
                </button>
              )}
            </>
          )}
          {canDelete && (rental.status === 'closed' || rental.status === 'cancelled') && (
            <button type="button" className="button-danger flex items-center gap-2 text-sm" onClick={() => { setConfirmDeleteOpen(true); setDeleteError(null) }}>
              <Trash2 size={13} />
              Delete record
            </button>
          )}
        </div>
      </div>

      {/* Main rental info card */}
      <section className="workspace-panel island-shell mb-4 p-5">
        <p className="island-kicker mb-3">Rental info</p>
        <DetailGrid rows={rentalInfo} />
      </section>

      {/* Handover card (visible once active or closed) */}
      {(rental.status === 'active' || rental.status === 'closed') && (
        <section className="workspace-panel island-shell mb-4 p-5">
          <p className="island-kicker mb-3">Vehicle handover</p>
          <DetailGrid
            rows={[
              { label: 'Start mileage (km)', value: rental.startMileage != null ? rental.startMileage.toLocaleString() : '—' },
              { label: 'Condition at start', value: rental.startConditionNote || '—' },
            ]}
          />
        </section>
      )}

      {/* Return card (visible once closed) */}
      {rental.status === 'closed' && (
        <section className="workspace-panel island-shell mb-4 p-5">
          <p className="island-kicker mb-3">Vehicle return</p>
          <DetailGrid
            rows={[
              { label: 'Return date', value: formatDate(rental.actualReturnDate) },
              { label: 'End mileage (km)', value: rental.endMileage != null ? rental.endMileage.toLocaleString() : '—' },
              { label: 'Condition at return', value: rental.endConditionNote || '—' },
              { label: 'Amount paid', value: <span className="font-semibold">{formatMYR(rental.paidAmountSen)}</span> },
            ]}
          />
        </section>
      )}

      {/* Documents */}
      {(rental.status === 'active' || rental.status === 'closed') && (
        <section className="workspace-panel island-shell mb-4 p-5">
          <p className="island-kicker mb-3">Documents</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <a
                href={`/api/documents/agreement/${rental.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button-secondary text-sm"
              >
                View agreement
              </a>
              <a
                href={`/api/documents/agreement/${rental.id}?download=1`}
                className="button-secondary text-sm"
              >
                ↓ Download
              </a>
            </div>
            {rental.status === 'closed' && (
              <div className="flex items-center gap-2">
                <a
                  href={`/api/documents/invoice/${rental.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-secondary text-sm"
                >
                  View invoice
                </a>
                <a
                  href={`/api/documents/invoice/${rental.id}?download=1`}
                  className="button-secondary text-sm"
                >
                  ↓ Download
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Cancelled notice */}
      {rental.status === 'cancelled' && (
        <section className="workspace-panel island-shell mb-4 p-4">
          <p className="text-sm text-[var(--sea-ink-soft)]">
            This rental was cancelled. No charges apply.
          </p>
        </section>
      )}

      {/* ── Confirm Handover Sheet ── */}
      <Sheet open={handoverOpen} onOpenChange={(open) => { if (!open) { setHandoverOpen(false); setHandoverError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Handover</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Confirm vehicle handover
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="handover-form" className="space-y-4" onSubmit={handleHandoverSubmit}>
              <div>
                <label className="field-label" htmlFor="ho-mileage">Start mileage (km)</label>
                <input
                  id="ho-mileage"
                  type="number"
                  className="field-input"
                  value={startMileage}
                  onChange={(e) => setStartMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ho-condition">Condition notes <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span></label>
                <textarea
                  id="ho-condition"
                  className="field-input min-h-[80px]"
                  value={startCondition}
                  onChange={(e) => setStartCondition(e.target.value)}
                  placeholder="e.g. Minor scratches on rear bumper…"
                />
              </div>
              {handoverError && <p className="form-error">{handoverError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="handover-form" disabled={isSubmittingHandover}>
              {isSubmittingHandover ? 'Confirming…' : 'Confirm handover'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setHandoverOpen(false); setHandoverError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Close Return Sheet ── */}
      <Sheet open={returnOpen} onOpenChange={(open) => { if (!open) { setReturnOpen(false); setReturnError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Return</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Close vehicle return
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="return-form" className="space-y-4" onSubmit={handleReturnSubmit}>
              <div>
                <label className="field-label" htmlFor="ret-mileage">End mileage (km)</label>
                <input
                  id="ret-mileage"
                  type="number"
                  className="field-input"
                  value={endMileage}
                  onChange={(e) => setEndMileage(e.target.value)}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ret-condition">Condition notes <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span></label>
                <textarea
                  id="ret-condition"
                  className="field-input min-h-[80px]"
                  value={endCondition}
                  onChange={(e) => setEndCondition(e.target.value)}
                  placeholder="e.g. No issues observed…"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ret-paid">Amount paid (RM)</label>
                <input
                  id="ret-paid"
                  type="number"
                  className="field-input"
                  value={paidAmountRM}
                  onChange={(e) => setPaidAmountRM(e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder={`0.00 (total: ${formatMYR(rental.totalAmountSen)})`}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="ret-method">Payment method</label>
                <select
                  id="ret-method"
                  className="field-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="ret-damage"
                  type="checkbox"
                  className="mt-0.5 accent-[var(--lagoon-deep)]"
                  checked={flagDamage}
                  onChange={(e) => setFlagDamage(e.target.checked)}
                />
                <label htmlFor="ret-damage" className="text-sm text-[var(--sea-ink)] cursor-pointer">
                  Flag car as damaged after return
                </label>
              </div>
              {returnError && <p className="form-error">{returnError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="return-form" disabled={isSubmittingReturn}>
              {isSubmittingReturn ? 'Closing…' : 'Close return'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setReturnOpen(false); setReturnError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Extend Rental Sheet ── */}
      <Sheet open={extendOpen} onOpenChange={(open) => { if (!open) { setExtendOpen(false); setExtendError(null) } }}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Extend</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Extend rental
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form id="extend-form" className="space-y-4" onSubmit={handleExtendSubmit}>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Current end date: <strong className="text-[var(--sea-ink)]">{formatDate(rental.endDate)}</strong>
              </p>
              <div>
                <label className="field-label" htmlFor="ext-date">New end date</label>
                <input
                  id="ext-date"
                  type="date"
                  className="field-input"
                  value={newEndDate}
                  min={toDateInput(rental.startDate)}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  required
                />
              </div>
              {extendError && <p className="form-error">{extendError}</p>}
            </form>
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="extend-form" disabled={isSubmittingExtend}>
              {isSubmittingExtend ? 'Extending…' : 'Extend rental'}
            </Button>
            <Button variant="outline" type="button" onClick={() => { setExtendOpen(false); setExtendError(null) }}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Confirm cancel overlay ── */}
      {confirmCancelOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog island-shell">
            <p className="island-kicker mb-2">Cancel booking</p>
            <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              Cancel this booking?
            </h3>
            <p className="mb-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
              The booking for <strong>{rental.carPlateNumber}</strong> will be cancelled and the car released back to available.
            </p>
            {cancelError && <p className="form-error mb-4">{cancelError}</p>}
            <div className="flex gap-3">
              <button type="button" className="button-danger" onClick={handleCancelConfirm} disabled={isCancelling}>
                {isCancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
              <button type="button" className="button-secondary" onClick={() => { setConfirmCancelOpen(false); setCancelError(null) }}>
                Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete overlay ── */}
      {confirmDeleteOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-dialog island-shell">
            <p className="island-kicker mb-2">Delete record</p>
            <h3 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">
              Delete this rental?
            </h3>
            <p className="mb-5 text-sm leading-6 text-[var(--sea-ink-soft)]">
              This will permanently remove the rental record for{' '}
              <strong>{rental.carPlateNumber}</strong>. This cannot be undone.
            </p>
            {deleteError && <p className="form-error mb-4">{deleteError}</p>}
            <div className="flex gap-3">
              <button type="button" className="button-danger" onClick={handleDeleteConfirm} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
              <button type="button" className="button-secondary" onClick={() => { setConfirmDeleteOpen(false); setDeleteError(null) }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSidebarShell>
  )
}
