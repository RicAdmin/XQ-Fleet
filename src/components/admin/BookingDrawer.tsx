import { useEffect, useState } from 'react'

import { Link } from '@tanstack/react-router'
import { FileText, MessageSquarePlus, Receipt, XCircle } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import {
  addAdminRentalNote,
  cancelAdminBooking,
  requestAdminRefund,
} from '#/lib/admin-rental-actions'
import type {
  AdminBookingDrawerPayload,
} from '#/lib/admin-dashboard-functions'
import { getAdminBookingDetail } from '#/lib/admin-dashboard-functions'

function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: Date): string {
  return new Date(d).toLocaleString('en-MY')
}

type BookingDrawerProps = {
  rentalId: string
  open: boolean
  onClose: () => void
  onMutated?: () => void
}

type Action = 'cancel' | 'refund' | 'note' | null

export function BookingDrawer({ rentalId, open, onClose, onMutated }: BookingDrawerProps) {
  const [payload, setPayload] = useState<AdminBookingDrawerPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [noteBody, setNoteBody] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await getAdminBookingDetail({ data: { rentalId } })
      if (!res) {
        setError('Booking not found.')
      } else {
        setPayload(res)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void load()
    } else {
      setPayload(null)
      setAction(null)
      setRefundAmount('')
      setRefundReason('')
      setCancelReason('')
      setNoteBody('')
      setActionError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rentalId])

  async function runCancel() {
    setActionLoading(true)
    setActionError(null)
    try {
      await cancelAdminBooking({
        data: {
          rentalId,
          reason: cancelReason.trim() || undefined,
        },
      })
      setAction(null)
      setCancelReason('')
      onMutated?.()
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Cancel failed.')
    } finally {
      setActionLoading(false)
    }
  }

  async function runRefund() {
    const sen = Math.round(Number(refundAmount) * 100)
    if (!Number.isFinite(sen) || sen <= 0) {
      setActionError('Enter a positive refund amount (RM).')
      return
    }
    setActionLoading(true)
    setActionError(null)
    try {
      await requestAdminRefund({
        data: {
          rentalId,
          amountSen: sen,
          reason: refundReason.trim() || undefined,
        },
      })
      setAction(null)
      setRefundAmount('')
      setRefundReason('')
      onMutated?.()
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Refund request failed.')
    } finally {
      setActionLoading(false)
    }
  }

  async function runNote() {
    if (!noteBody.trim()) {
      setActionError('Note body cannot be empty.')
      return
    }
    setActionLoading(true)
    setActionError(null)
    try {
      await addAdminRentalNote({
        data: { rentalId, body: noteBody.trim() },
      })
      setAction(null)
      setNoteBody('')
      onMutated?.()
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to add note.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Booking details</SheetTitle>
          <SheetDescription>
            {payload ? (
              <>
                {payload.booking.carPlateNumber ?? '—'} ·{' '}
                {payload.booking.customerFullName ?? '—'}
              </>
            ) : (
              'Loading…'
            )}
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center gap-2 px-4 py-6 text-sm text-[var(--sea-ink-soft)]">
            <LoadingSpinner size={14} />
            Loading booking…
          </div>
        )}

        {error && <ErrorPanel title="Could not load booking" message={error} onRetry={load} />}

        {payload && (
          <>
            <div className="booking-drawer-section">
              <dl>
                <div className="booking-drawer-row">
                  <dt>Status</dt>
                  <dd className="capitalize">{payload.booking.status}</dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Payment</dt>
                  <dd className="capitalize">{payload.booking.paymentStatus}</dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Pickup</dt>
                  <dd>
                    {formatDate(payload.booking.startDate)}{' '}
                    {payload.booking.pickUpTime ?? ''}{' '}
                    {payload.booking.pickUpLocation && (
                      <span className="text-[var(--sea-ink-soft)]">· {payload.booking.pickUpLocation}</span>
                    )}
                  </dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Return</dt>
                  <dd>
                    {formatDate(payload.booking.endDate)}{' '}
                    {payload.booking.returnTime ?? ''}{' '}
                    {payload.booking.returnLocation && (
                      <span className="text-[var(--sea-ink-soft)]">· {payload.booking.returnLocation}</span>
                    )}
                  </dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Subtotal</dt>
                  <dd>{formatMYR(payload.booking.subTotalSen)}</dd>
                </div>
                {payload.booking.discountAmountSen > 0 && (
                  <div className="booking-drawer-row">
                    <dt>Discount</dt>
                    <dd>-{formatMYR(payload.booking.discountAmountSen)}</dd>
                  </div>
                )}
                <div className="booking-drawer-row">
                  <dt>Total</dt>
                  <dd className="font-semibold">{formatMYR(payload.booking.totalAmountSen)}</dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Paid</dt>
                  <dd>{formatMYR(payload.booking.paidAmountSen)}</dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Email</dt>
                  <dd>{payload.booking.customerEmail ?? '—'}</dd>
                </div>
                <div className="booking-drawer-row">
                  <dt>Phone</dt>
                  <dd>{payload.booking.customerPhone ?? '—'}</dd>
                </div>
                {payload.booking.couponCode && (
                  <div className="booking-drawer-row">
                    <dt>Promo</dt>
                    <dd className="font-mono">{payload.booking.couponCode}</dd>
                  </div>
                )}
              </dl>
              <Link
                to="/admin/rentals/$rentalId"
                params={{ rentalId }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--lagoon-deep)] hover:underline"
              >
                <FileText size={12} /> Open full rental detail page
              </Link>
            </div>

            <div className="booking-drawer-section">
              <p className="island-kicker">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button-secondary inline-flex items-center gap-1.5"
                  onClick={() =>
                    setAction((a) => (a === 'cancel' ? null : 'cancel'))
                  }
                  disabled={payload.booking.status === 'cancelled' || payload.booking.status === 'closed'}
                >
                  <XCircle size={13} /> Cancel
                </button>
                <button
                  type="button"
                  className="button-secondary inline-flex items-center gap-1.5"
                  onClick={() =>
                    setAction((a) => (a === 'refund' ? null : 'refund'))
                  }
                  disabled={payload.booking.paidAmountSen <= 0}
                >
                  <Receipt size={13} /> Request refund
                </button>
                <button
                  type="button"
                  className="button-secondary inline-flex items-center gap-1.5"
                  onClick={() => setAction((a) => (a === 'note' ? null : 'note'))}
                >
                  <MessageSquarePlus size={13} /> Add note
                </button>
              </div>

              {actionError && (
                <p className="form-error mt-2" role="alert">
                  {actionError}
                </p>
              )}

              {action === 'cancel' && (
                <div className="mt-3 space-y-2">
                  <label className="field-label">Reason (optional)</label>
                  <textarea
                    className="field-input"
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button
                    type="button"
                    className="button-primary inline-flex items-center gap-1.5"
                    disabled={actionLoading}
                    onClick={runCancel}
                  >
                    {actionLoading && <LoadingSpinner size={12} />}
                    Confirm cancel
                  </button>
                </div>
              )}

              {action === 'refund' && (
                <div className="mt-3 space-y-2">
                  <label className="field-label">Refund amount (RM)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    className="field-input"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  <label className="field-label">Reason (optional)</label>
                  <textarea
                    className="field-input"
                    rows={2}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                  <button
                    type="button"
                    className="button-primary inline-flex items-center gap-1.5"
                    disabled={actionLoading}
                    onClick={runRefund}
                  >
                    {actionLoading && <LoadingSpinner size={12} />}
                    Request refund
                  </button>
                </div>
              )}

              {action === 'note' && (
                <div className="mt-3 space-y-2">
                  <label className="field-label">Internal note</label>
                  <textarea
                    className="field-input"
                    rows={3}
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                  />
                  <button
                    type="button"
                    className="button-primary inline-flex items-center gap-1.5"
                    disabled={actionLoading}
                    onClick={runNote}
                  >
                    {actionLoading && <LoadingSpinner size={12} />}
                    Save note
                  </button>
                </div>
              )}
            </div>

            <div className="booking-drawer-section">
              <p className="island-kicker">Internal notes ({payload.notes.length})</p>
              {payload.notes.length === 0 ? (
                <p className="text-xs text-[var(--sea-ink-soft)]">No notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {payload.notes.map((n) => (
                    <li key={n.id} className="rounded-md border border-[var(--line)] p-2 text-xs">
                      <p className="m-0 text-[var(--sea-ink)] whitespace-pre-wrap">{n.body}</p>
                      <p className="m-0 mt-1 text-[var(--sea-ink-soft)]">
                        {n.authorName ?? 'System'} · {formatDateTime(n.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="booking-drawer-section">
              <p className="island-kicker">Refunds ({payload.refunds.length})</p>
              {payload.refunds.length === 0 ? (
                <p className="text-xs text-[var(--sea-ink-soft)]">No refunds requested.</p>
              ) : (
                <ul className="space-y-2">
                  {payload.refunds.map((r) => (
                    <li key={r.id} className="rounded-md border border-[var(--line)] p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-semibold">{r.status}</span>
                        <span>{formatMYR(r.amountSen)}</span>
                      </div>
                      {r.reason && (
                        <p className="m-0 mt-1 text-[var(--sea-ink-soft)]">{r.reason}</p>
                      )}
                      <p className="m-0 mt-1 text-[var(--sea-ink-soft)]">
                        Requested {formatDateTime(r.requestedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <SheetFooter>
          <button type="button" className="button-secondary" onClick={onClose}>
            Close
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
