import { useEffect, useMemo, useRef, useState } from 'react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { type Column, DataTable } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import {
  CAR_CATEGORY_FILTER_OPTIONS,
  type CarCategoryFilter,
} from '#/lib/car-category-options'
import {
  getFleetAvailability,
  type AvailabilityCarRow,
  type FleetAvailabilitySummary,
} from '#/lib/availability-functions'

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysYmd(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

type AdminAvailabilityProps = {
  session: { user: { name: string; email: string; role: string } }
  initialStartDate?: string
  initialEndDate?: string
  initialSummary?: FleetAvailabilitySummary
  initialCars?: AvailabilityCarRow[]
}

const DATE_DEBOUNCE_MS = 400

export default function AdminAvailability({
  session,
  initialStartDate,
  initialEndDate,
  initialSummary,
  initialCars,
}: AdminAvailabilityProps) {
  const skipInitialLoad = useRef(Boolean(initialCars))
  const [startDate, setStartDate] = useState(initialStartDate ?? todayYmd())
  const [endDate, setEndDate] = useState(initialEndDate ?? addDaysYmd(3))
  const [debouncedStartDate, setDebouncedStartDate] = useState(startDate)
  const [debouncedEndDate, setDebouncedEndDate] = useState(endDate)
  const [category, setCategory] = useState<CarCategoryFilter>('all')
  const [summary, setSummary] = useState<FleetAvailabilitySummary | null>(initialSummary ?? null)
  const [cars, setCars] = useState<AvailabilityCarRow[]>(initialCars ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const result = await getFleetAvailability({
        data: {
          startDate: debouncedStartDate,
          endDate: debouncedEndDate,
          category: category === 'all' ? undefined : category,
        },
      })
      setSummary(result.summary)
      setCars(result.cars)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStartDate(startDate)
      setDebouncedEndDate(endDate)
    }, DATE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [startDate, endDate])

  useEffect(() => {
    if (skipInitialLoad.current) {
      skipInitialLoad.current = false
      return
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStartDate, debouncedEndDate, category])

  const columns = useMemo<Column<AvailabilityCarRow>[]>(
    () => [
      {
        key: 'vehicle',
        header: 'Vehicle',
        render: (row) => (
          <div>
            <div className="font-semibold text-[var(--sea-ink)]">
              {row.make} {row.model} ({row.year})
            </div>
            <div className="text-xs text-[var(--sea-ink-soft)]">
              {row.plateNumber ?? 'No plate'} · {row.category}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Fleet status',
        render: (row) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        key: 'capacity',
        header: 'Capacity',
        render: (row) => (
          <span className="text-sm">
            {row.numberOfUnits}+{row.overbookUnits} · {row.blockingRentals} booked
          </span>
        ),
      },
      {
        key: 'trip',
        header: 'Trip window',
        render: (row) => (
          <span
            className={
              row.availableForTrip
                ? 'text-sm font-semibold text-[var(--success)]'
                : 'text-sm font-semibold text-[var(--error)]'
            }
          >
            {row.availableForTrip ? 'Available' : 'Unavailable'}
          </span>
        ),
      },
      {
        key: 'rate',
        header: 'Daily rate',
        headerClassName: 'text-right',
        cellClassName: 'text-right font-mono text-sm',
        render: (row) => formatMYR(row.dailyRateSen),
      },
    ],
    [],
  )

  return (
    <AdminSidebarShell user={session.user} pageTitle="Availability">
      <PageHeader
        title="Availability"
        description="Fleet inventory and booking capacity for a custom date range."
      />

      <article className="workspace-panel island-shell space-y-4 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="field-label" htmlFor="avail-from">
              From
            </label>
            <input
              id="avail-from"
              type="date"
              className="field-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="avail-to">
              To
            </label>
            <input
              id="avail-to"
              type="date"
              className="field-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="avail-category">
              Category
            </label>
            <StatusFilterSelect
              aria-label="Filter by category"
              value={category}
              options={CAR_CATEGORY_FILTER_OPTIONS}
              onValueChange={(value) => setCategory(value as CarCategoryFilter)}
              className="w-full min-w-[9rem]"
            />
          </div>
        </div>

        {summary ? (
          <div className="grid gap-2 border-b border-[var(--line)] px-4 py-3 sm:grid-cols-5">
            {[
              ['Total', summary.totalCars],
              ['Available', summary.availableCars],
              ['Reserved', summary.reservedCars],
              ['Rented', summary.rentedCars],
              ['Maintenance', summary.maintenanceCars],
            ].map(([label, count]) => (
              <div key={label} className="rounded-lg border border-[var(--line)] px-3 py-2">
                <p className="text-sm font-medium text-[var(--sea-ink-soft)]">
                  {label}
                </p>
                <p className="text-xl font-bold text-[var(--sea-ink)]">{count}</p>
              </div>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="p-4">
            <ErrorPanel title="Could not load availability" message={error} onRetry={load} />
          </div>
        ) : null}

        {loading && !cars.length ? <TableSkeleton rows={8} columns={5} /> : null}

        {!loading || cars.length ? (
          <DataTable
            columns={columns}
            data={cars}
            getKey={(row) => row.id}
            emptyState={
              <div className="p-6 text-center text-sm text-muted-foreground">
                No vehicles match this filter.
              </div>
            }
          />
        ) : null}
      </article>
    </AdminSidebarShell>
  )
}
