import { useEffect, useMemo, useState } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChartColumn, X, ImageOff, Layers } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { AdminListFilterBar } from '#/components/ui/AdminListFilterBar'
import { Button } from '#/components/ui/button'
import { DataTable, type Column } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusFilterSelect } from '#/components/ui/StatusFilterSelect'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import type { CarCategory, CarColor } from '#/db/schema'
import {
  listCarModels,
  listCarModelUtilisation,
  type CarModelListRow,
  type CarModelUtilisationEntry,
} from '#/lib/car-model-functions'
import { formatPartnerCode } from '#/lib/partner-functions'

export const Route = createFileRoute('/admin/car-models/')({
  beforeLoad: async ({ cause }) => {
    if (cause === 'preload') return
    const models = await listCarModels()
    return { models }
  },
  component: CarModelsPage,
})

const CATEGORY_LABEL: Record<CarCategory, string> = {
  economy: 'Economy',
  mpv: 'MPV',
  suv: 'SUV',
  other: 'Other',
}

const COLOR_LABEL: Record<CarColor, string> = {
  white: 'White',
  black: 'Black',
  silver: 'Silver',
  grey: 'Grey',
  red: 'Red',
  blue: 'Blue',
  'dark-blue': 'Dark Blue',
  maroon: 'Maroon',
  gold: 'Gold',
  beige: 'Beige',
  green: 'Green',
  other: 'Other',
}

function CarModelsPage() {
  const navigate = useNavigate()
  const ctx = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    models?: CarModelListRow[]
  }

  const [models, setModels] = useState<CarModelListRow[] | null>(ctx.models ?? null)
  const [loading, setLoading] = useState(!ctx.models)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | CarCategory>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [chartExpanded, setChartExpanded] = useState(false)
  const [chartCategory, setChartCategory] = useState<CarCategory | null>(null)
  const [utilisation, setUtilisation] = useState<CarModelUtilisationEntry[] | null>(null)

  useEffect(() => {
    if (!chartExpanded || utilisation !== null) return
    let cancelled = false
    async function load() {
      try {
        const next = await listCarModelUtilisation()
        if (!cancelled) setUtilisation(next)
      } catch {
        if (!cancelled) setUtilisation([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [chartExpanded, utilisation])

  useEffect(() => {
    if (ctx.models) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const next = await listCarModels()
        if (!cancelled) setModels(next)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load car models.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [ctx.models])

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    for (const row of models ?? []) {
      for (const unit of row.ownedUnits) years.add(unit.year)
    }
    return [...years].sort((a, b) => b - a)
  }, [models])

  const filteredModels = useMemo(() => {
    const query = searchInput.trim().toLowerCase()
    return (models ?? []).filter((row) => {
      if (categoryFilter !== 'all' && row.category !== categoryFilter) return false
      if (yearFilter !== 'all' && !row.ownedUnits.some((u) => String(u.year) === yearFilter)) {
        return false
      }
      if (!query) return true
      const haystack = [
        `${row.make} ${row.model}`,
        row.slug ?? '',
        ...row.ownedUnits.map((u) => u.plateNumber),
        ...row.partners.flatMap((p) => [p.partnerCode, formatPartnerCode(p.partnerCode)]),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [models, searchInput, categoryFilter, yearFilter])

  const activeFilterCount =
    (categoryFilter !== 'all' ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0)
  const hasActiveFilters = activeFilterCount > 0 || searchInput.trim() !== ''

  const columns: Column<CarModelListRow>[] = [
    {
      key: 'model',
      header: 'Car model',
      render: (row) => (
        <div className="fleet-vehicle-cell">
          <div className="fleet-vehicle-cell__media" aria-hidden>
            {row.coverPhotoUrl ? (
              <img src={row.coverPhotoUrl} alt="" className="fleet-vehicle-cell__img" />
            ) : (
              <span className="fleet-vehicle-cell__placeholder">
                <ImageOff size={20} strokeWidth={1.75} />
              </span>
            )}
          </div>
          <div className="fleet-vehicle-cell__body">
            <Link
              to="/admin/car-models/$carId"
              params={{ carId: row.listingCarId }}
              className="fleet-vehicle-cell__name"
              onClick={(e) => e.stopPropagation()}
            >
              {row.make} {row.model}
            </Link>
            <p className="fleet-vehicle-cell__meta">
              {row.vehicleCount} vehicle{row.vehicleCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Type',
      render: (row) => (
        <span className={`category-pill category-pill--${row.category}`}>
          {CATEGORY_LABEL[row.category]}
        </span>
      ),
    },
    {
      key: 'owned',
      header: 'Owned',
      render: (row) =>
        row.ownedUnits.length === 0 ? (
          <span className="fleet-capacity-owned fleet-capacity-owned--empty">—</span>
        ) : (
          <div className="fleet-capacity-owned">
            {row.ownedUnits.map((unit) => (
              <div key={unit.plateNumber} className="fleet-capacity-owned__line">
                <span className="fleet-capacity-owned__plate">{unit.plateNumber}</span>
                <span className="fleet-capacity-owned__meta">
                  ({COLOR_LABEL[unit.color]}) {unit.year}
                </span>
              </div>
            ))}
          </div>
        ),
    },
    {
      key: 'partner',
      header: 'Partner',
      render: (row) =>
        row.partners.length === 0 ? (
          <span className="fleet-capacity-partner fleet-capacity-partner--empty">—</span>
        ) : (
          <div className="fleet-capacity-partner">
            {row.partners.map((partner) => (
              <div key={partner.partnerCode} className="fleet-capacity-partner__line">
                <span className="fleet-capacity-partner__code">
                  {formatPartnerCode(partner.partnerCode)}
                </span>
                <span className="fleet-capacity-partner__count">{partner.maxUnits}</span>
              </div>
            ))}
          </div>
        ),
    },
  ]

  return (
    <AdminSidebarShell user={ctx.session.user} pageTitle="Car models">
      <PageHeader
        kicker="Fleet"
        title="Car models"
        description="Catalog models, booking capacity, and partner overbook — separate from individual plates."
        actions={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            aria-expanded={chartExpanded}
            onClick={() => setChartExpanded((prev) => !prev)}
          >
            <ChartColumn size={15} />
            Utilisation
          </Button>
        }
      />

      <div className="space-y-3">
        {error ? <ErrorPanel message={error} /> : null}
        {chartExpanded ? (
          <article className="workspace-panel island-shell p-4">
            <div className="fleet-usage-chart__head">
              <div>
                <p className="island-kicker">Utilisation</p>
                <h3 className="text-base font-semibold text-[var(--sea-ink)]">
                  Rented days {new Date().getFullYear()} — self-owned fleet by model
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--sea-ink-soft)]">
                  Highest to lowest
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  aria-label="Close chart"
                  onClick={() => setChartExpanded(false)}
                >
                  <X size={14} />
                  Close
                </Button>
              </div>
            </div>
            {utilisation === null ? (
              <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">Loading…</p>
            ) : utilisation.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
                No self-owned vehicles yet.
              </p>
            ) : (
              <>
                <div className="fleet-usage-chart__categories" role="group" aria-label="Chart category">
                  {(Object.keys(CATEGORY_LABEL) as CarCategory[])
                    .filter((category) => utilisation.some((e) => e.category === category))
                    .map((category) => (
                      <button
                        key={category}
                        type="button"
                        aria-pressed={chartCategory === category}
                        data-active={chartCategory === category ? 'true' : 'false'}
                        className="admin-filter-preset h-[1.875rem] min-h-[1.875rem] max-h-[1.875rem] active:translate-y-0 inline-flex items-center rounded-md border border-[var(--line)] px-2.5 text-[0.8125rem] font-medium transition-colors hover:bg-[var(--surface-muted)] data-[active=true]:border-[var(--ui-ink)] data-[active=true]:bg-[var(--ui-ink)] data-[active=true]:text-white"
                        onClick={() =>
                          setChartCategory((prev) => (prev === category ? null : category))
                        }
                      >
                        {CATEGORY_LABEL[category]}
                      </button>
                    ))}
                </div>
                {chartCategory === null ? (
                  <p className="mt-3 text-sm text-[var(--sea-ink-soft)]">
                    Select a category to view utilisation.
                  </p>
                ) : (
                  <div className="fleet-usage-chart mt-3">
                    {utilisation
                      .filter((entry) => entry.category === chartCategory)
                      .map((entry) => (
                        <div key={`${entry.make}-${entry.model}`} className="fleet-usage-chart__row">
                          <span className="fleet-usage-chart__car">
                            {entry.coverPhotoUrl ? (
                              <img
                                src={entry.coverPhotoUrl}
                                alt=""
                                className="fleet-usage-chart__thumb"
                              />
                            ) : (
                              <span className="fleet-usage-chart__thumb fleet-usage-chart__thumb--empty" />
                            )}
                            <span className="fleet-usage-chart__label">
                              <span className="fleet-usage-chart__model">
                                {entry.make} {entry.model}
                              </span>
                              <span className="fleet-usage-chart__plate">
                                {CATEGORY_LABEL[entry.category]}
                              </span>
                            </span>
                          </span>
                          <span
                            className="fleet-usage-chart__track"
                            role="img"
                            aria-label={`Monthly rented days for ${entry.make} ${entry.model}`}
                          >
                            {entry.monthlyDays.map((monthDays, monthIdx) => {
                              const monthLength = new Date(
                                new Date().getFullYear(),
                                monthIdx + 1,
                                0,
                              ).getDate()
                              const fill = Math.min(1, monthDays / monthLength)
                              const monthName = new Date(
                                new Date().getFullYear(),
                                monthIdx,
                                1,
                              ).toLocaleDateString('en-MY', { month: 'short' })
                              return (
                                <span
                                  key={monthIdx}
                                  className="fleet-usage-chart__month"
                                  title={`${monthName} ${new Date().getFullYear()} — ${monthDays} rented day${monthDays === 1 ? '' : 's'} (total ${entry.days}d)`}
                                >
                                  <span
                                    className="fleet-usage-chart__month-fill"
                                    style={{ height: `${fill * 100}%` }}
                                  />
                                </span>
                              )
                            })}
                          </span>
                          <span className="fleet-usage-chart__days tabular-nums">
                            {entry.days}d
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </article>
        ) : null}
        <article className="workspace-panel island-shell overflow-x-auto p-0">
          {loading || !models ? (
            <TableSkeleton rows={6} />
          ) : (
            <>
              <AdminListFilterBar
                searchValue={searchInput}
                onSearchChange={setSearchInput}
                onSearchClear={() => setSearchInput('')}
                searchPlaceholder="Search model, plate, partner…"
                searchAriaLabel="Search car models"
                resultSummary={`${filteredModels.length} model${filteredModels.length !== 1 ? 's' : ''}`}
                filtersOpen={filtersOpen}
                onFiltersOpenChange={setFiltersOpen}
                activeFilterCount={activeFilterCount}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => {
                  setSearchInput('')
                  setCategoryFilter('all')
                  setYearFilter('all')
                }}
              >
                <StatusFilterSelect
                  aria-label="Filter by type"
                  value={categoryFilter}
                  options={[
                    { value: 'all' as const, label: 'All types' },
                    ...(Object.entries(CATEGORY_LABEL) as [CarCategory, string][]).map(
                      ([value, label]) => ({ value, label }),
                    ),
                  ]}
                  onValueChange={setCategoryFilter}
                />
                <StatusFilterSelect
                  aria-label="Filter by year"
                  value={yearFilter}
                  options={[
                    { value: 'all', label: 'All years' },
                    ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
                  ]}
                  onValueChange={setYearFilter}
                />
              </AdminListFilterBar>
              <DataTable
                className="cars-table--fleet"
                columns={columns}
                data={filteredModels}
                getKey={(row) => row.listingCarId}
                onRowClick={(row) =>
                  void navigate({
                    to: '/admin/car-models/$carId',
                    params: { carId: row.listingCarId },
                  })
                }
                emptyState={
                  <div className="hub-empty-state m-6">
                    <Layers size={28} className="text-[var(--sea-ink-soft)]" />
                    <p className="text-sm text-[var(--sea-ink-soft)]">
                      {hasActiveFilters
                        ? 'No car models match these filters.'
                        : 'No car models yet. Add vehicles to create make/model groups.'}
                    </p>
                  </div>
                }
              />
            </>
          )}
        </article>
      </div>
    </AdminSidebarShell>
  )
}
