import { useEffect, useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlarmClock,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Undo2,
  Wallet,
} from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { Button } from '#/components/ui/button'
import {
  getCsDashboard,
  type CsDashboardPayload,
  type CsPaymentChaseRow,
  type CsScheduleRow,
  type CsToConfirmRow,
} from '#/lib/cs-dashboard-functions'
import { confirmRentalBooking } from '#/lib/rental-functions'
import { jobBookingRef } from '#/lib/job-display'
import { INTERNAL_JOBS_PATH } from '#/lib/internal-routes'
import { cn } from '#/lib/utils'

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
  })
}

function formatTimeLabel(time: string | null): string {
  if (!time) return '—'
  const match = /^(\d{2}):(\d{2})/.exec(time.trim())
  if (!match) return time.trim()
  const h = Number(match[1])
  const m = match[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function formatAge(fromIso: string, now: Date): string {
  const ms = now.getTime() - new Date(fromIso).getTime()
  const hours = Math.floor(ms / 3_600_000)
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m`
  if (hours < 48) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function formatCountdown(toIso: string, now: Date): { label: string; expired: boolean; urgent: boolean } {
  const ms = new Date(toIso).getTime() - now.getTime()
  if (ms <= 0) return { label: 'Expired', expired: true, urgent: true }
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) {
    return { label: `${minutes}m left`, expired: false, urgent: true }
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return {
      label: `${hours}h ${minutes % 60}m`,
      expired: false,
      urgent: hours < 24,
    }
  }
  return { label: `${Math.floor(hours / 24)}d`, expired: false, urgent: false }
}

function waLink(phone: string | null): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) digits = `6${digits}`
  return `https://wa.me/${digits}`
}

function holdUrgency(
  expiresAt: string | null,
  now: Date,
): 'none' | 'ok' | 'urgent' | 'expired' {
  if (!expiresAt) return 'none'
  const { expired, urgent } = formatCountdown(expiresAt, now)
  if (expired) return 'expired'
  if (urgent) return 'urgent'
  return 'ok'
}

function HoldChip({ expiresAt, now }: { expiresAt: string | null; now: Date }) {
  if (!expiresAt) {
    return <span className="cs-dash-chip cs-dash-chip--muted">No hold</span>
  }
  const { label, expired, urgent } = formatCountdown(expiresAt, now)
  return (
    <span
      className={cn(
        'cs-dash-chip',
        expired && 'cs-dash-chip--danger',
        !expired && urgent && 'cs-dash-chip--warn',
        !expired && !urgent && 'cs-dash-chip--ok',
      )}
    >
      <AlarmClock size={11} aria-hidden />
      {label}
    </span>
  )
}

function PaymentChaseRow({ row, now }: { row: CsPaymentChaseRow; now: Date }) {
  const wa = waLink(row.customerPhone)
  const urgency = holdUrgency(row.paymentHoldExpiresAt, now)
  const ref = jobBookingRef(row.rentalId)

  return (
    <li className={cn('cs-dash-queue__row', `cs-dash-queue__row--${urgency}`)}>
      <Link
        to="/internal/jobs/$jobId"
        params={{ jobId: row.rentalId }}
        className="cs-dash-queue__main"
      >
        <div className="cs-dash-queue__head">
          <span className="cs-dash-queue__ref">{ref}</span>
          <span className="cs-dash-queue__age">booked {formatAge(row.createdAt, now)} ago</span>
        </div>
        <p className="cs-dash-queue__customer">{row.customerName ?? 'Unnamed'}</p>
        <p className="cs-dash-queue__meta">
          {row.carLabel}
          {row.plateNumber ? (
            <>
              {' '}
              · <span className="font-mono">{row.plateNumber}</span>
            </>
          ) : null}
          {' '}
          · pickup {formatDateShort(row.startDate)}
        </p>
        <div className="cs-dash-queue__tags">
          <HoldChip expiresAt={row.paymentHoldExpiresAt} now={now} />
          <span
            className={cn(
              'cs-dash-chip',
              row.paymentStatus === 'partial' ? 'cs-dash-chip--warn' : 'cs-dash-chip--danger',
            )}
          >
            {row.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
          </span>
        </div>
      </Link>
      <div className="cs-dash-queue__side">
        <span className="cs-dash-queue__amount">{formatMYR(row.outstandingSen)}</span>
        <div className="cs-dash-queue__actions" onClick={(e) => e.stopPropagation()}>
          {row.customerPhone ? (
            <a
              className="cs-dash-icon-btn"
              href={`tel:${row.customerPhone}`}
              aria-label={`Call ${row.customerName ?? 'customer'}`}
              title={row.customerPhone}
            >
              <Phone size={14} />
            </a>
          ) : null}
          {wa ? (
            <a
              className="cs-dash-icon-btn"
              href={wa}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp ${row.customerName ?? 'customer'}`}
            >
              <MessageCircle size={14} />
            </a>
          ) : null}
          <Link
            className="cs-dash-icon-btn cs-dash-icon-btn--primary"
            to="/internal/jobs/$jobId"
            params={{ jobId: row.rentalId }}
            aria-label="Open job"
          >
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </li>
  )
}

function ToConfirmRow({
  row,
  now,
  onConfirmed,
}: {
  row: CsToConfirmRow
  now: Date
  onConfirmed: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wa = waLink(row.customerPhone)
  const ref = jobBookingRef(row.rentalId)
  const countdown = row.bookingExpiresAt
    ? formatCountdown(row.bookingExpiresAt, now)
    : null

  async function handleConfirm() {
    setConfirming(true)
    setError(null)
    try {
      await confirmRentalBooking({ data: { rentalId: row.rentalId } })
      onConfirmed()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm job.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <li
      className={cn(
        'cs-dash-queue__row',
        countdown?.urgent && 'cs-dash-queue__row--urgent',
      )}
    >
      <Link
        to="/internal/jobs/$jobId"
        params={{ jobId: row.rentalId }}
        className="cs-dash-queue__main"
      >
        <div className="cs-dash-queue__head">
          <span className="cs-dash-queue__ref">{ref}</span>
          {row.own ? <span className="cs-dash-chip cs-dash-chip--ok">Mine</span> : null}
          <span className="cs-dash-queue__age">booked {formatAge(row.createdAt, now)} ago</span>
        </div>
        <p className="cs-dash-queue__customer">{row.customerName ?? 'Unnamed'}</p>
        <p className="cs-dash-queue__meta">
          {row.carLabel}
          {row.plateNumber ? (
            <>
              {' '}
              · <span className="font-mono">{row.plateNumber}</span>
            </>
          ) : null}
          {' '}
          · pickup {formatDateShort(row.startDate)}
        </p>
        <div className="cs-dash-queue__tags">
          {countdown ? (
            <span
              className={cn(
                'cs-dash-chip',
                countdown.urgent ? 'cs-dash-chip--warn' : 'cs-dash-chip--muted',
              )}
            >
              <AlarmClock size={11} aria-hidden />
              {countdown.label}
            </span>
          ) : (
            <span className="cs-dash-chip cs-dash-chip--muted">72h window</span>
          )}
        </div>
        {error ? <p className="cs-dash-queue__error">{error}</p> : null}
      </Link>
      <div className="cs-dash-queue__side">
        <span className="cs-dash-queue__amount">{formatMYR(row.outstandingSen)}</span>
        <div className="cs-dash-queue__actions" onClick={(e) => e.stopPropagation()}>
          {row.customerPhone ? (
            <a
              className="cs-dash-icon-btn"
              href={`tel:${row.customerPhone}`}
              aria-label={`Call ${row.customerName ?? 'customer'}`}
              title={row.customerPhone}
            >
              <Phone size={14} />
            </a>
          ) : null}
          {wa ? (
            <a
              className="cs-dash-icon-btn"
              href={wa}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp ${row.customerName ?? 'customer'}`}
            >
              <MessageCircle size={14} />
            </a>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={confirming}
            onClick={() => void handleConfirm()}
          >
            {confirming ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </li>
  )
}

function ScheduleTimeline({
  rows,
  emptyLabel,
  variant,
}: {
  rows: CsScheduleRow[]
  emptyLabel: string
  variant: 'pickup' | 'return'
}) {
  if (rows.length === 0) {
    return (
      <div className="cs-dash-empty">
        <CheckCircle2 size={18} aria-hidden />
        <p>{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ul className="cs-dash-timeline">
      {rows.map((row) => (
        <li key={row.rentalId}>
          <Link
            to="/internal/jobs/$jobId"
            params={{ jobId: row.rentalId }}
            className={cn(
              'cs-dash-timeline__item',
              row.overdue && 'cs-dash-timeline__item--overdue',
            )}
          >
            <span
              className={cn(
                'cs-dash-timeline__time',
                variant === 'pickup' && 'cs-dash-timeline__time--pickup',
                variant === 'return' && 'cs-dash-timeline__time--return',
              )}
            >
              {formatTimeLabel(row.time)}
            </span>
            <span className="cs-dash-timeline__body">
              <span className="cs-dash-timeline__name">
                {row.customerName ?? 'Unnamed'}
                {row.overdue ? <span className="cs-dash-timeline__badge">Overdue</span> : null}
              </span>
              <span className="cs-dash-timeline__meta">
                {row.carLabel}
                {row.plateNumber ? (
                  <>
                    {' '}
                    · <span className="font-mono">{row.plateNumber}</span>
                  </>
                ) : null}
              </span>
              {row.location ? (
                <span className="cs-dash-timeline__loc">{row.location}</span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

type CsDashboardProps = {
  session: { user: { name: string; email: string; role: string } }
  initialData: CsDashboardPayload
}

export default function CsDashboard({ session, initialData }: CsDashboardProps) {
  const navigate = useNavigate()
  const [data, setData] = useState(initialData)
  const [refreshing, setRefreshing] = useState(false)
  const now = useNow()

  async function refresh() {
    setRefreshing(true)
    try {
      setData(await getCsDashboard())
    } finally {
      setRefreshing(false)
    }
  }

  const { kpis } = data
  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? 'there'
  const todayLabel = now.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const updatedLabel = new Date(data.generatedAt).toLocaleTimeString('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <AdminSidebarShell user={session.user} pageTitle="CS Dashboard">
      <div className="cs-dash">
        <header className="cs-dash-head">
          <div className="cs-dash-head__copy">
            <p className="cs-dash-head__kicker">Customer service</p>
            <h1 className="cs-dash-head__title">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {firstName}</h1>
            <p className="cs-dash-head__sub">
              {todayLabel}
              <span className="cs-dash-head__dot" aria-hidden />
              Updated {updatedLabel}
            </p>
          </div>
          <div className="cs-dash-head__actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
              className="gap-1.5"
            >
              <RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-1.5"
              onClick={() => void navigate({ to: '/admin/availability' })}
            >
              <Plus size={14} />
              Create Job
            </Button>
          </div>
        </header>

        <div className="cs-dash-metrics">
          <div
            className={cn(
              'cs-dash-metric',
              kpis.pendingPaymentCount > 0 && 'cs-dash-metric--active',
            )}
          >
            <span className="cs-dash-metric__icon cs-dash-metric__icon--payments">
              <Wallet size={16} />
            </span>
            <div className="cs-dash-metric__body">
              <span className="cs-dash-metric__value">{kpis.pendingPaymentCount}</span>
              <span className="cs-dash-metric__label">Pending payments</span>
              <span className="cs-dash-metric__sub">{formatMYR(kpis.pendingPaymentOutstandingSen)}</span>
            </div>
          </div>
          <div
            className={cn(
              'cs-dash-metric',
              (kpis.holdsExpiringWithin24h > 0 || kpis.holdsExpired > 0) && 'cs-dash-metric--active',
            )}
          >
            <span className="cs-dash-metric__icon cs-dash-metric__icon--holds">
              <AlarmClock size={16} />
            </span>
            <div className="cs-dash-metric__body">
              <span className="cs-dash-metric__value">{kpis.holdsExpiringWithin24h}</span>
              <span className="cs-dash-metric__label">Holds &lt;24h</span>
              {kpis.holdsExpired > 0 ? (
                <span className="cs-dash-metric__sub cs-dash-metric__sub--danger">
                  {kpis.holdsExpired} expired
                </span>
              ) : (
                <span className="cs-dash-metric__sub">Reservation timers</span>
              )}
            </div>
          </div>
          <div className={cn('cs-dash-metric', kpis.pickupsToday > 0 && 'cs-dash-metric--active')}>
            <span className="cs-dash-metric__icon cs-dash-metric__icon--pickups">
              <KeyRound size={16} />
            </span>
            <div className="cs-dash-metric__body">
              <span className="cs-dash-metric__value">{kpis.pickupsToday}</span>
              <span className="cs-dash-metric__label">Pickups today</span>
              <span className="cs-dash-metric__sub">Handovers scheduled</span>
            </div>
          </div>
          <div
            className={cn(
              'cs-dash-metric',
              (kpis.returnsToday > 0 || kpis.overdueReturns > 0) && 'cs-dash-metric--active',
            )}
          >
            <span className="cs-dash-metric__icon cs-dash-metric__icon--returns">
              <Undo2 size={16} />
            </span>
            <div className="cs-dash-metric__body">
              <span className="cs-dash-metric__value">{kpis.returnsToday}</span>
              <span className="cs-dash-metric__label">Returns today</span>
              {kpis.overdueReturns > 0 ? (
                <span className="cs-dash-metric__sub cs-dash-metric__sub--danger">
                  {kpis.overdueReturns} overdue
                </span>
              ) : (
                <span className="cs-dash-metric__sub">Due back today</span>
              )}
            </div>
          </div>
        </div>

        <div className="cs-dash-layout">
          <div className="cs-dash-main">
          <article className="cs-dash-panel cs-dash-panel--queue workspace-panel island-shell">
            <header className="cs-dash-panel__head">
              <div>
                <h2 className="cs-dash-panel__title">
                  <AlarmClock size={16} aria-hidden />
                  To confirm
                </h2>
                <p className="cs-dash-panel__desc">
                  Booked jobs must be confirmed within 72 hours or they expire.
                </p>
              </div>
              <span className="cs-dash-panel__count">{data.toConfirm.length}</span>
            </header>
            {data.toConfirm.length === 0 ? (
              <div className="cs-dash-empty cs-dash-empty--panel">
                <CheckCircle2 size={20} aria-hidden />
                <p>Nothing awaiting confirmation.</p>
              </div>
            ) : (
              <ul className="cs-dash-queue">
                {data.toConfirm.map((row) => (
                  <ToConfirmRow key={row.rentalId} row={row} now={now} onConfirmed={refresh} />
                ))}
              </ul>
            )}
          </article>

          <article className="cs-dash-panel cs-dash-panel--queue workspace-panel island-shell">
            <header className="cs-dash-panel__head">
              <div>
                <h2 className="cs-dash-panel__title">
                  <Wallet size={16} aria-hidden />
                  Payment chase
                </h2>
                <p className="cs-dash-panel__desc">
                  Unpaid and partial bookings — contact before the hold expires.
                </p>
              </div>
              <span className="cs-dash-panel__count">{data.paymentChase.length}</span>
            </header>
            {data.paymentChase.length === 0 ? (
              <div className="cs-dash-empty cs-dash-empty--panel">
                <CheckCircle2 size={20} aria-hidden />
                <p>No outstanding payments. Nice work.</p>
              </div>
            ) : (
              <ul className="cs-dash-queue">
                {data.paymentChase.map((row) => (
                  <PaymentChaseRow key={row.rentalId} row={row} now={now} />
                ))}
              </ul>
            )}
          </article>
          </div>

          <div className="cs-dash-side">
            <article className="cs-dash-panel workspace-panel island-shell">
              <header className="cs-dash-panel__head">
                <div>
                  <h2 className="cs-dash-panel__title">
                    <CalendarClock size={16} aria-hidden />
                    Today&apos;s pickups
                  </h2>
                  <p className="cs-dash-panel__desc">{kpis.pickupsToday} handover{kpis.pickupsToday !== 1 ? 's' : ''}</p>
                </div>
              </header>
              <ScheduleTimeline
                rows={data.pickupsToday}
                emptyLabel="No pickups scheduled today."
                variant="pickup"
              />
            </article>

            <article className="cs-dash-panel workspace-panel island-shell">
              <header className="cs-dash-panel__head">
                <div>
                  <h2 className="cs-dash-panel__title">
                    <Undo2 size={16} aria-hidden />
                    Returns due
                  </h2>
                  <p className="cs-dash-panel__desc">
                    {kpis.returnsToday} due today
                    {kpis.overdueReturns > 0 ? ` · ${kpis.overdueReturns} overdue` : ''}
                  </p>
                </div>
              </header>
              <ScheduleTimeline
                rows={data.returnsToday}
                emptyLabel="No returns due."
                variant="return"
              />
            </article>
          </div>
        </div>

        <footer className="cs-dash-foot">
          <Link to={INTERNAL_JOBS_PATH} className="cs-dash-foot__link">
            All jobs
            <ArrowRight size={14} />
          </Link>
          <Link to="/admin/availability" className="cs-dash-foot__link">
            Availability
            <ArrowRight size={14} />
          </Link>
        </footer>
      </div>
    </AdminSidebarShell>
  )
}
