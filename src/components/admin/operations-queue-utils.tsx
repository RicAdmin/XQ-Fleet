import { cn } from '#/lib/utils'
import type { RentalListRow } from '#/lib/rental-functions'

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

export function OperationScheduleCell({ rental }: { rental: RentalListRow }) {
  return (
    <div className="admin-op-schedule">
      <div className="admin-op-schedule-row">
        <span className="admin-op-schedule-label">Pickup</span>
        <span className="admin-op-schedule-value">
          {formatOperationDateTime(rental.startDate, rental.pickUpTime)}
        </span>
      </div>
      <div className="admin-op-schedule-row">
        <span className="admin-op-schedule-label">Return</span>
        <span className="admin-op-schedule-value">
          {formatOperationDateTime(rental.endDate, rental.returnTime)}
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
      row.customerEmail,
      row.carPlateNumber,
      row.carMake,
      row.carModel,
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
      row.customerEmail,
      row.carPlateNumber,
      row.carMake,
      row.carModel,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(search)
  })
}
