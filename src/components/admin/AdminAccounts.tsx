import { useState } from 'react'

import { Link } from '@tanstack/react-router'

import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import { type Column, DataTable } from '#/components/ui/DataTable'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { StatusBadge } from '#/components/ui/StatusBadge'
import {
  listJobsForAccounts,
  processDepositRefund,
  type AccountJobRow,
} from '#/lib/account-functions'
import { jobBookingRef } from '#/lib/job-display'

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type AdminAccountsProps = {
  initialRows: AccountJobRow[]
}

export function AdminAccounts({ initialRows }: AdminAccountsProps) {
  const [rows, setRows] = useState(initialRows)
  const [refundTarget, setRefundTarget] = useState<AccountJobRow | null>(null)
  const [refundAmountRM, setRefundAmountRM] = useState('')
  const [refundNotes, setRefundNotes] = useState('')
  const [refundError, setRefundError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function reload() {
    setRows(await listJobsForAccounts())
  }

  function openRefund(row: AccountJobRow) {
    setRefundTarget(row)
    setRefundAmountRM((row.depositPendingSen / 100).toFixed(2))
    setRefundNotes('')
    setRefundError(null)
  }

  async function handleRefundSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!refundTarget) return
    setRefundError(null)
    setIsSubmitting(true)
    try {
      await processDepositRefund({
        data: {
          rentalId: refundTarget.rentalId,
          amountSen: Math.round(Number(refundAmountRM) * 100),
          notes: refundNotes || undefined,
        },
      })
      setRefundTarget(null)
      showAdminToast('Deposit refund recorded.')
      await reload()
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : 'Failed to record refund.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<AccountJobRow>[] = [
    {
      key: 'job',
      header: 'Job',
      render: (r) => (
        <Link
          to="/internal/jobs/$jobId"
          params={{ jobId: r.rentalId }}
          className="font-mono text-[var(--lagoon-deep)] underline-offset-2 hover:underline"
        >
          {jobBookingRef(r.rentalId)}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div>
          <div className="font-medium">{r.customerName ?? 'Unnamed'}</div>
          <div className="text-xs text-[var(--sea-ink-soft)]">{r.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'car',
      header: 'Car',
      render: (r) => (
        <div>
          <div className="font-mono">{r.plateNumber ?? '—'}</div>
          <div className="text-xs text-[var(--sea-ink-soft)]">{r.carLabel}</div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Trip',
      render: (r) => (
        <span className="whitespace-nowrap text-sm">
          {formatDate(r.startDate)} → {formatDate(r.endDate)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (r) => (
        <div>
          <StatusBadge status={r.paymentStatus} size="sm" />
          <div className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
            {formatMYR(r.paidAmountSen)} / {formatMYR(r.totalAmountSen)}
            {r.outstandingSen > 0 ? ` · due ${formatMYR(r.outstandingSen)}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'deposit',
      header: 'Deposit',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (r) => (
        <div>
          <div className="font-medium">{formatMYR(r.depositPaidSen)}</div>
          {r.depositPendingSen > 0 ? (
            <div className="text-xs font-medium text-[#f97316]">
              {formatMYR(r.depositPendingSen)} to refund
            </div>
          ) : (
            <div className="text-xs text-[var(--sea-ink-soft)]">
              {r.depositRefundedSen > 0 ? 'Refunded' : '—'}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cellClassName: 'text-right',
      render: (r) =>
        r.status === 'closed' && r.depositPendingSen > 0 ? (
          <Button size="sm" variant="outline" onClick={() => openRefund(r)}>
            Refund deposit
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable<AccountJobRow>
        columns={columns}
        data={rows}
        getKey={(r) => r.rentalId}
        emptyState={<p className="py-8 text-center text-sm text-[var(--sea-ink-soft)]">No paid jobs yet.</p>}
      />

      <Sheet
        open={refundTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRefundTarget(null)
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[28rem]">
          <SheetHeader className="border-b border-[var(--line)] px-5 pb-4 pt-5">
            <p className="island-kicker mb-1">Accounts</p>
            <SheetTitle className="text-lg font-semibold text-[var(--sea-ink)]">
              Refund deposit
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {refundTarget ? (
              <form id="refund-form" className="space-y-4" onSubmit={handleRefundSubmit}>
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Job{' '}
                  <strong className="font-mono text-[var(--sea-ink)]">
                    {jobBookingRef(refundTarget.rentalId)}
                  </strong>{' '}
                  · deposit collected {formatMYR(refundTarget.depositPaidSen)} · pending{' '}
                  {formatMYR(refundTarget.depositPendingSen)}
                </p>
                <div>
                  <label className="field-label" htmlFor="refund-amount">
                    Refund amount (RM)
                  </label>
                  <input
                    id="refund-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={(refundTarget.depositPendingSen / 100).toFixed(2)}
                    className="field-input"
                    value={refundAmountRM}
                    onChange={(e) => setRefundAmountRM(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="refund-notes">
                    Notes{' '}
                    <span className="font-normal text-[var(--sea-ink-soft)]">(optional)</span>
                  </label>
                  <textarea
                    id="refund-notes"
                    className="field-input min-h-[80px]"
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder="e.g. Bank transfer to customer account…"
                  />
                </div>
                {refundError ? <p className="form-error">{refundError}</p> : null}
              </form>
            ) : null}
          </div>
          <SheetFooter className="flex-row gap-2 border-t border-[var(--line)] px-5 py-4">
            <Button type="submit" form="refund-form" disabled={isSubmitting}>
              {isSubmitting ? 'Recording…' : 'Record refund'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setRefundTarget(null)}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
