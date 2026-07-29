import { cn } from '#/lib/utils'
import { jobBookingRef } from '#/lib/job-display'
import type { RentalListRow } from '#/lib/rental-functions'
import { StatusBadge } from '#/components/ui/StatusBadge'

export function formatOperationDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

export function formatOperationTime(time: string | null, dateFallback?: Date): string {
  if (time) {
    const [h, m] = time.split(':').map(Number)
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      const ampm = h < 12 ? 'AM' : 'PM'
      const hour = h % 12 || 12
      return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
    }
    return time
  }
  if (dateFallback) {
    return dateFallback.toLocaleTimeString('en-MY', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kuala_Lumpur',
    })
  }
  return '—'
}

export function formatOperationDateTime(date: Date, time: string | null): string {
  return `${formatOperationDate(date)} · ${formatOperationTime(time, date)}`
}

export function formatMYR(sen: number): string {
  return `RM ${(sen / 100).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function combineDateTime(date: Date, timeHms: string | null): Date {
  const base = new Date(date)
  if (!timeHms) return base
  const [h, m, s] = timeHms.split(':').map((part) => Number(part))
  base.setHours(h || 0, m || 0, s || 0, 0)
  return base
}

export function formatRentalDuration(rental: RentalListRow): string {
  const pickup = combineDateTime(rental.startDate, rental.pickUpTime)
  const returnAt = combineDateTime(rental.endDate, rental.returnTime)
  const ms = Math.max(0, returnAt.getTime() - pickup.getTime())
  const totalHours = Math.round(ms / (1000 * 60 * 60))
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24

  if (days === 0) return `${hours} hr${hours === 1 ? '' : 's'}`
  if (hours === 0) return `${days} day${days === 1 ? '' : 's'}`
  return `${days} day${days === 1 ? '' : 's'} ${hours} hr${hours === 1 ? '' : 's'}`
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function isPickupOverdue(r: RentalListRow) {
  return new Date(r.startDate) < startOfToday()
}

export function isReturnOverdue(r: RentalListRow) {
  return new Date(r.endDate) < startOfToday()
}

export function DueBadge({
  overdue,
  className,
}: {
  overdue: boolean
  className?: string
}) {
  if (!overdue) return null
  return (
    <span
      className={cn(
        'inline-flex rounded-full bg-[#fef2f2] px-2 py-0.5 text-[0.75rem] font-medium text-[#b91c1c]',
        className,
      )}
    >
      Overdue
    </span>
  )
}

export function OperationDueCell({
  date,
  time,
  overdue,
}: {
  date: Date
  time: string | null
  overdue: boolean
}) {
  return (
    <div className="admin-op-due">
      <div className="admin-op-datetime">{formatOperationDateTime(date, time)}</div>
      {overdue ? <DueBadge overdue className="mt-1" /> : null}
    </div>
  )
}

export function OperationCustomerCell({ rental }: { rental: RentalListRow }) {
  return (
    <div>
      <div className="admin-op-strong">{rental.customerFullName ?? '—'}</div>
      {rental.customerPhone ? (
        <div className="admin-op-meta">{rental.customerPhone}</div>
      ) : null}
      {rental.customerIcOrPassport ? (
        <div className="admin-op-meta font-mono">{rental.customerIcOrPassport}</div>
      ) : null}
    </div>
  )
}

export function OperationPaymentCell({ rental }: { rental: RentalListRow }) {
  const balanceSen = Math.max(0, rental.totalAmountSen - rental.paidAmountSen)

  return (
    <div>
      <StatusBadge status={rental.paymentStatus} size="sm" />
      {rental.depositAmountSen > 0 ? (
        <div className="admin-op-meta mt-1">
          Dep. {formatMYR(rental.depositAmountSen)}
        </div>
      ) : null}
      {balanceSen > 0 ? (
        <div className="admin-op-meta mt-1 font-medium text-amber-700">
          Bal. {formatMYR(balanceSen)}
        </div>
      ) : null}
    </div>
  )
}

export function OperationJobContext({ rental }: { rental: RentalListRow }) {
  return (
    <div className="op-context">
      <div className="op-context__body">
        <div className="op-context__name">{rental.customerFullName ?? '—'}</div>
        <div className="op-context__meta">
          {formatOperationDateTime(rental.startDate, rental.pickUpTime)}
          {rental.pickUpLocation ? ` · ${rental.pickUpLocation}` : ''}
        </div>
      </div>
    </div>
  )
}

export function OperationScheduleCell({ rental }: { rental: RentalListRow }) {
  return (
    <div className="admin-op-schedule">
      <div className="admin-op-schedule-row">
        <span className="admin-op-schedule-label">Pickup</span>
        <span className="admin-op-schedule-value">
          {formatOperationDateTime(rental.startDate, rental.pickUpTime)}
          {rental.pickUpLocation ? (
            <span className="block text-[var(--sea-ink-soft)]">{rental.pickUpLocation}</span>
          ) : null}
        </span>
      </div>
      <div className="admin-op-schedule-row">
        <span className="admin-op-schedule-label">Return</span>
        <span className="admin-op-schedule-value">
          {formatOperationDateTime(rental.endDate, rental.returnTime)}
          {rental.returnLocation ? (
            <span className="block text-[var(--sea-ink-soft)]">{rental.returnLocation}</span>
          ) : null}
        </span>
      </div>
      <div className="admin-op-schedule-duration">{formatRentalDuration(rental)}</div>
    </div>
  )
}

export function OperationMoneyCell({
  amountSen,
  emphasis = false,
}: {
  amountSen: number
  emphasis?: boolean
}) {
  return (
    <span className={cn('admin-op-money', emphasis && 'admin-op-money--emphasis')}>
      {formatMYR(amountSen)}
    </span>
  )
}

export function OperationJobCarCell({ rental }: { rental: RentalListRow }) {
  const plate =
    rental.carPlateNumber ?? rental.tempPlateLabel ?? rental.listingPlateNumber ?? null
  return (
    <div>
      <div className="admin-op-ref">{jobBookingRef(rental.id)}</div>
      <div className="admin-op-meta">
        {plate ? <span className="font-mono">{plate}</span> : 'Plate TBC'}
      </div>
      {plate && rental.carMake ? (
        <div className="admin-op-meta">
          {`${rental.carMake} ${rental.carModel ?? ''}`.trim()}
        </div>
      ) : null}
    </div>
  )
}

export function OperationPickupCell({ rental }: { rental: RentalListRow }) {
  return (
    <div className="admin-op-due">
      <div className="admin-op-datetime">
        {formatOperationDateTime(rental.startDate, rental.pickUpTime)}
      </div>
      {rental.pickUpLocation ? (
        <div className="admin-op-meta">{rental.pickUpLocation}</div>
      ) : null}
      {isPickupOverdue(rental) && rental.status === 'confirmed' ? (
        <DueBadge overdue className="mt-1" />
      ) : null}
      {rental.handoverByName ? (
        <div className="admin-op-meta mt-0.5">Handled by {rental.handoverByName}</div>
      ) : null}
    </div>
  )
}

export function OperationReturnCell({ rental }: { rental: RentalListRow }) {
  return (
    <div className="admin-op-due">
      <div className="admin-op-datetime">
        {formatOperationDateTime(rental.endDate, rental.returnTime)}
      </div>
      <div className="admin-op-meta">
        {[rental.returnLocation, formatRentalDuration(rental)].filter(Boolean).join(' · ')}
      </div>
      {isReturnOverdue(rental) && rental.status === 'active' ? (
        <DueBadge overdue className="mt-1" />
      ) : null}
      {rental.returnByName ? (
        <div className="admin-op-meta mt-0.5">Handled by {rental.returnByName}</div>
      ) : null}
    </div>
  )
}

export function OperationHandledByCell({
  name,
  at,
}: {
  name: string | null
  at: Date | null
}) {
  if (!name) return <span className="admin-op-meta">—</span>
  const atLabel = at
    ? `${formatOperationDate(at)} · ${new Date(at).toLocaleTimeString('en-MY', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kuala_Lumpur',
      })}`
    : null
  return (
    <div>
      <div className="admin-op-strong">{name}</div>
      {atLabel ? <div className="admin-op-meta">{atLabel}</div> : null}
    </div>
  )
}

export function OperationCustomerContactCell({ rental }: { rental: RentalListRow }) {
  return (
    <div>
      <div className="admin-op-strong">{rental.customerFullName ?? '—'}</div>
      {rental.customerPhone ? (
        <div className="admin-op-meta">{rental.customerPhone}</div>
      ) : null}
      {rental.customerEmail ? (
        <div className="admin-op-meta">{rental.customerEmail}</div>
      ) : null}
    </div>
  )
}

export function OperationDepositCell({ rental }: { rental: RentalListRow }) {
  if (rental.depositAmountSen <= 0) {
    return <span className="text-[var(--sea-ink-soft)]">—</span>
  }
  const collected = rental.paidAmountSen >= rental.depositAmountSen
  const collectedSen = Math.min(rental.paidAmountSen, rental.depositAmountSen)
  return (
    <div>
      <div className="admin-op-money admin-op-money--emphasis">
        {formatMYR(rental.depositAmountSen)}
      </div>
      <div
        className={cn(
          'admin-op-meta mt-0.5 font-medium',
          collected ? 'text-emerald-700' : 'text-amber-700',
        )}
      >
        {collected ? 'Collected' : 'Pending'}
      </div>
      <div className="admin-op-meta">
        {collectedSen > 0
          ? `${formatMYR(collectedSen)} by ${rental.createdByName ?? '—'}`
          : 'Not collected'}
      </div>
    </div>
  )
}

export function OperationTotalCell({ rental }: { rental: RentalListRow }) {
  return (
    <div>
      <div className="admin-op-money">{formatMYR(rental.totalAmountSen)}</div>
      <div className="admin-op-meta">Paid {formatMYR(rental.paidAmountSen)}</div>
    </div>
  )
}

export function OperationDurationCell({ rental }: { rental: RentalListRow }) {
  return (
    <span className="job-trip__duration tabular-nums">
      {formatRentalDuration(rental)}
    </span>
  )
}

export type OperationQueueFilters = {
  search?: string
  from?: string
  to?: string
}
export function filterPickupRows(
  rows: RentalListRow[],
  filters: OperationQueueFilters,
): RentalListRow[] {
  const search = filters.search?.trim().toLowerCase()
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null

  return rows.filter((row) => {
    const pickupDate = new Date(row.startDate)
    if (from && pickupDate < from) return false
    if (to && pickupDate > to) return false
    if (!search) return true

    const haystack = [
      row.customerFullName,
      row.customerPhone,
      row.customerIcOrPassport,
      row.customerEmail,
      row.carPlateNumber,
      row.carMake,
      row.carModel,
      row.pickUpLocation,
      row.returnLocation,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
}

export function filterReturnRows(
  rows: RentalListRow[],
  filters: OperationQueueFilters,
): RentalListRow[] {
  const search = filters.search?.trim().toLowerCase()
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null

  return rows.filter((row) => {
    const returnDate = new Date(row.endDate)
    if (from && returnDate < from) return false
    if (to && returnDate > to) return false
    if (!search) return true

    const haystack = [
      row.customerFullName,
      row.customerPhone,
      row.customerIcOrPassport,
      row.customerEmail,
      row.carPlateNumber,
      row.carMake,
      row.carModel,
      row.pickUpLocation,
      row.returnLocation,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
}
