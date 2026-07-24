import { useState } from 'react'

import { useNavigate } from '@tanstack/react-router'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import { ConfirmActionDialog } from '#/components/ui/ConfirmActionDialog'
import { Card, CardContent, CardDescription, CardHeader } from '#/components/ui/card'
import { PageHeader } from '#/components/ui/PageHeader'
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

  // ── Derived ───────────────────────────────────────────────────────────────

  const rentalDays = Math.max(
    1,
    Math.ceil(
      (new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  )

  const balanceSen = Math.max(0, rental.totalAmountSen - rental.paidAmountSen)

  return (
    <AdminSidebarShell user={session.user} pageTitle="Rental detail">
      <PageHeader
        variant="detail"
        backLink={{ to: listPath, label: 'Back' }}
        title={rental.carPlateNumber ?? 'Rental'}
        description={
          <>
            <span>{rental.customerFullName ?? 'Customer'}</span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span>{rental.type === 'walk-in' ? 'Walk-in' : 'Booking'}</span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span>
              {rentalDays} day{rentalDays !== 1 ? 's' : ''}
            </span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span className="tabular-nums">
              {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
            </span>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RentalStatusBadge status={rental.status} />
            {rental.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="button-primary text-sm"
                  onClick={() => setHandoverOpen(true)}
                >
                  Confirm handover
                </button>
                <button
                  type="button"
                  className="button-danger text-sm"
                  onClick={() => {
                    setConfirmCancelOpen(true)
                    setCancelError(null)
                  }}
                >
                  Cancel booking
                </button>
              </div>
            ) : null}
            {rental.status === 'active' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="button-primary text-sm"
                  onClick={() => {
                    setPaidAmountRM('')
                    setReturnOpen(true)
                  }}
                >
                  Close return
                </button>
                {session.user.role === 'owner' ? (
                  <button
                    type="button"
                    className="button-secondary text-sm"
                    onClick={() => {
                      setNewEndDate(toDateInput(rental.endDate))
                      setExtendOpen(true)
                    }}
                  >
                    Extend rental
                  </button>
                ) : null}
              </div>
            ) : null}
            {canDelete && (rental.status === 'closed' || rental.status === 'cancelled') ? (
              <button
                type="button"
                className="button-danger text-sm"
                onClick={() => {
                  setConfirmDeleteOpen(true)
                  setDeleteError(null)
                }}
              >
                Delete record
              </button>
            ) : null}
          </div>
        }
      />

      {rental.status === 'cancelled' ? (
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          This rental was cancelled. No charges apply.
        </p>
      ) : null}

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="island-kicker">Vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2">
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Plate</dt>
                <dd className="font-mono text-sm font-semibold text-[var(--lagoon-deep)]">
                  {rental.carPlateNumber ?? '—'}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Model</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {[rental.carMake, rental.carModel].filter(Boolean).join(' ') || '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="island-kicker">Customer</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2">
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Name</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {rental.customerFullName ?? '—'}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Phone</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {rental.customerPhone ?? '—'}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">IC / Passport</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {rental.customerIcOrPassport ?? '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="island-kicker">Booking</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2">
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Type</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {rental.type === 'walk-in' ? 'Walk-in' : 'Advance booking'}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Dates</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Duration</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {rentalDays} day{rentalDays !== 1 ? 's' : ''}
                </dd>
              </div>
              {(rental.status === 'active' || rental.status === 'closed') && (
                <div className="summary-row">
                  <dt className="text-sm text-[var(--sea-ink-soft)]">Mileage</dt>
                  <dd className="text-sm font-medium text-[var(--sea-ink)]">
                    {rental.startMileage != null
                      ? `${rental.startMileage.toLocaleString()} km`
                      : '—'}
                    {' → '}
                    {rental.status === 'closed' && rental.endMileage != null
                      ? `${rental.endMileage.toLocaleString()} km`
                      : 'out'}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="island-kicker">Payment</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2">
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Total</dt>
                <dd className="text-sm font-semibold text-[var(--sea-ink)]">
                  {formatMYR(rental.totalAmountSen)}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Paid</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">
                  {formatMYR(rental.paidAmountSen)}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Balance</dt>
                <dd
                  className={`text-sm font-medium ${balanceSen > 0 ? 'text-amber-700' : 'text-[var(--sea-ink)]'}`}
                >
                  {formatMYR(balanceSen)}
                </dd>
              </div>
              <div className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">Status</dt>
                <dd>
                  <PaymentBadge status={rental.paymentStatus} />
                </dd>
              </div>
            </dl>
            {(rental.status === 'active' || rental.status === 'closed') && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
                <a
                  href={`/api/documents/agreement/${rental.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button-secondary text-sm"
                >
                  Agreement
                </a>
                <a
                  href={`/api/documents/agreement/${rental.id}?download=1`}
                  className="button-secondary text-sm"
                >
                  Download
                </a>
                {rental.status === 'closed' ? (
                  <>
                    <a
                      href={`/api/documents/invoice/${rental.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="button-secondary text-sm"
                    >
                      Invoice
                    </a>
                    <a
                      href={`/api/documents/invoice/${rental.id}?download=1`}
                      className="button-secondary text-sm"
                    >
                      Download
                    </a>
                  </>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

      {/* ── Confirm cancel ── */}
      <ConfirmActionDialog
        open={confirmCancelOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmCancelOpen(false)
            setCancelError(null)
          }
        }}
        title="Cancel this booking?"
        description={
          <>
            The booking for <strong>{rental.carPlateNumber}</strong> will be cancelled and the car released back to available.
            {cancelError ? (
              <span className="mt-2 block text-[var(--error)]">{cancelError}</span>
            ) : null}
          </>
        }
        confirmLabel="Cancel booking"
        cancelLabel="Keep"
        variant="destructive"
        confirming={isCancelling}
        onConfirm={handleCancelConfirm}
      />

      {/* ── Confirm delete ── */}
      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDeleteOpen(false)
            setDeleteError(null)
          }
        }}
        title="Delete this rental?"
        description={
          <>
            This will permanently remove the rental record for{' '}
            <strong>{rental.carPlateNumber}</strong>. This cannot be undone.
            {deleteError ? (
              <span className="mt-2 block text-[var(--error)]">{deleteError}</span>
            ) : null}
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </AdminSidebarShell>
  )
}
