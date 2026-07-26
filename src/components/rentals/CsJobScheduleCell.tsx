import {
  formatOperationDate,
  formatOperationTime,
} from '#/components/admin/operations-queue-utils'
import type { RentalListRow } from '#/lib/rental-functions'

function ArrangementLeg({
  location,
  date,
  time,
}: {
  location: string | null
  date: Date
  time: string | null
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-medium tabular-nums text-[var(--sea-ink)]">
        {formatOperationDate(date)} : {formatOperationTime(time, date)}
      </div>
      <div className="mt-0.5 truncate text-xs text-[var(--sea-ink-soft)]">
        {location?.trim() || '—'}
      </div>
    </div>
  )
}

/** Pickup + return locations and datetimes for the Jobs Arrangement column. */
export function CsJobArrangementCell({ rental }: { rental: RentalListRow }) {
  return (
    <div className="min-w-[11rem] space-y-2 text-left">
      <ArrangementLeg
        location={rental.pickUpLocation}
        date={rental.startDate}
        time={rental.pickUpTime}
      />
      <ArrangementLeg
        location={rental.returnLocation}
        date={rental.endDate}
        time={rental.returnTime}
      />
    </div>
  )
}

/** @deprecated Prefer CsJobArrangementCell */
export function CsJobScheduleCell({ rental }: { rental: RentalListRow }) {
  return <CsJobArrangementCell rental={rental} />
}
