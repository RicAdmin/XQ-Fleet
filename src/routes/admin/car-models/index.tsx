import { useEffect, useState } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ImageOff, Layers } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { DataTable, type Column } from '#/components/ui/DataTable'
import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { PageHeader } from '#/components/ui/PageHeader'
import { TableSkeleton } from '#/components/ui/TableSkeleton'
import type { CarCategory, CarColor } from '#/db/schema'
import { listCarModels, type CarModelListRow } from '#/lib/car-model-functions'
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
              {row.slug ? `/${row.slug}` : `${row.vehicleCount} vehicle${row.vehicleCount === 1 ? '' : 's'}`}
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
      />

      <div className="space-y-3">
        {error ? <ErrorPanel message={error} /> : null}
        <article className="workspace-panel island-shell overflow-x-auto p-0">
          {loading || !models ? (
            <TableSkeleton rows={6} />
          ) : (
            <DataTable
              className="cars-table--fleet"
              columns={columns}
              data={models}
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
                    No car models yet. Add vehicles to create make/model groups.
                  </p>
                </div>
              }
            />
          )}
        </article>
      </div>
    </AdminSidebarShell>
  )
}
