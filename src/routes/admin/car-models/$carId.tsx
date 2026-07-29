import { useEffect, useState } from 'react'

import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Banknote, Globe, Handshake, Image as ImageIcon, LayoutGrid, Layers } from 'lucide-react'

import { CarCapacityPanel } from '#/components/cars/CarCapacityPanel'
import { CarPhotoManager } from '#/components/cars/CarPhotoManager'
import { CarPricingPanel } from '#/components/cars/CarPricingPanel'
import { CarWebsitePanel } from '#/components/cars/CarWebsitePanel'
import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { PageHeader } from '#/components/ui/PageHeader'
import { StatusBadge } from '#/components/ui/StatusBadge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import type { CarCategory, CarColor } from '#/db/schema'
import { isFullAdminRole, type AppRole } from '#/lib/auth-model'
import { getCarById, getCarPhotos, type CarPhotoRow } from '#/lib/car-functions'
import { getCarModelByListingId } from '#/lib/car-model-functions'

export const Route = createFileRoute('/admin/car-models/$carId')({
  beforeLoad: async ({ params, cause }) => {
    if (cause === 'preload') return
    const model = await getCarModelByListingId({ data: { carId: params.carId } })
    if (!model) throw notFound()
    const listing = model.listing
    return { model, listing }
  },
  component: CarModelDetailPage,
})

const MODEL_TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutGrid },
  { value: 'capacity', label: 'Self-Owned', icon: Layers },
  { value: 'partner', label: 'Partner', icon: Handshake },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'photos', label: 'Photos', icon: ImageIcon },
  { value: 'pricing', label: 'Pricing', icon: Banknote },
] as const

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

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function CarModelDetailPage() {
  const { session, model: initialModel, listing: initialListing } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    model: Awaited<ReturnType<typeof getCarModelByListingId>>
    listing: NonNullable<Awaited<ReturnType<typeof getCarById>>>
  }

  const isOwner = isFullAdminRole(session.user.role as AppRole)
  const [activeTab, setActiveTab] = useState('overview')
  const [listing, setListing] = useState(initialListing)
  const [vehicles, setVehicles] = useState(initialModel.vehicles)
  const [photos, setPhotos] = useState<CarPhotoRow[] | null>(null)
  const [photosLoading, setPhotosLoading] = useState(false)
  const [coverPhoto, setCoverPhoto] = useState<CarPhotoRow | null>(null)

  useEffect(() => {
    let cancelled = false
    void getCarPhotos({ data: { carId: listing.id } })
      .then((rows) => {
        if (!cancelled) setCoverPhoto(rows.find((p) => p.isCover) ?? rows[0] ?? null)
      })
      .catch(() => {
        if (!cancelled) setCoverPhoto(null)
      })
    return () => {
      cancelled = true
    }
  }, [listing.id])

  useEffect(() => {
    setListing(initialListing)
    setVehicles(initialModel.vehicles)
  }, [initialListing, initialModel])

  useEffect(() => {
    if (activeTab !== 'photos') return
    let cancelled = false
    async function loadPhotos() {
      setPhotosLoading(true)
      try {
        const next = await getCarPhotos({ data: { carId: listing.id } })
        if (!cancelled) setPhotos(next)
      } catch {
        if (!cancelled) setPhotos([])
      } finally {
        if (!cancelled) setPhotosLoading(false)
      }
    }
    void loadPhotos()
    return () => {
      cancelled = true
    }
  }, [activeTab, listing.id])

  return (
    <AdminSidebarShell user={session.user} pageTitle="Car model">
      <PageHeader
        variant="detail"
        backLink={{ to: '/admin/car-models', label: 'Back' }}
        title={`${listing.make} ${listing.model}`}
        description={
          <>
            <span className="island-kicker">
              {CATEGORY_LABEL[listing.category].toUpperCase()}
            </span>
            <span className="ui-meta-sep" aria-hidden>
              ·
            </span>
            <span className="text-sm text-[var(--sea-ink-soft)]">
              {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'}
            </span>
            {listing.slug ? (
              <>
                <span className="ui-meta-sep" aria-hidden>
                  ·
                </span>
                <span className="font-mono text-xs text-[var(--sea-ink-soft)]">
                  /{listing.slug}
                </span>
              </>
            ) : null}
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList variant="pill">
          {MODEL_TABS.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger key={t.value} value={t.value}>
                <Icon size={17} />
                {t.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card size="sm" className="h-full">
              <CardHeader className="pb-0">
                <CardDescription className="island-kicker">Model summary</CardDescription>
                <CardTitle className="sr-only">Model summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-3">
                {coverPhoto ? (
                  <div className="job-detail-vehicle__photo job-detail-vehicle__photo--wide">
                    <img
                      src={coverPhoto.url}
                      alt={coverPhoto.altText ?? `${listing.make} ${listing.model}`}
                    />
                  </div>
                ) : null}
                <dl className="flex flex-col gap-1.5">
                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Make</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">{listing.make}</dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Model</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">{listing.model}</dd>
                    </div>
                  </div>
                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Category</dt>
                      <dd>
                        <span className={`category-pill category-pill--${listing.category}`}>
                          {CATEGORY_LABEL[listing.category]}
                        </span>
                      </dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Daily rate</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {formatMYR(listing.dailyRateSen)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card size="sm" className="h-full">
              <CardHeader className="pb-0">
                <CardDescription className="island-kicker">Luggage & boot</CardDescription>
                <CardTitle className="sr-only">Luggage and boot</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-3">
                {listing.largeSuitcasesCount != null || listing.smallCarryonsCount != null ? (
                  <div className="luggage-illustration" aria-hidden="true">
                    <div className="luggage-illustration__bags">
                      {Array.from({ length: listing.largeSuitcasesCount ?? 0 }).map((_, i) => (
                        <span key={`lg-${i}`} className="luggage-bag luggage-bag--lg">
                          <span className="luggage-bag__handle" />
                          <span className="luggage-bag__stripe" />
                          <em>L</em>
                        </span>
                      ))}
                      {Array.from({ length: listing.smallCarryonsCount ?? 0 }).map((_, i) => (
                        <span key={`sm-${i}`} className="luggage-bag luggage-bag--sm">
                          <span className="luggage-bag__handle" />
                          <span className="luggage-bag__stripe" />
                          <em>S</em>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                <dl className="flex flex-col gap-1.5">
                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Large suitcases</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {listing.largeSuitcasesCount ?? '—'}
                      </dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Small carry-ons</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {listing.smallCarryonsCount ?? '—'}
                      </dd>
                    </div>
                  </div>
                  <div className="summary-row summary-row--compact summary-row--split">
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Boot</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {listing.bootCapacityLabel ||
                          (listing.bootCapacityL != null ? `${listing.bootCapacityL} L` : '—')}
                      </dd>
                    </div>
                    <div className="summary-field">
                      <dt className="text-sm text-[var(--sea-ink-soft)]">Combined</dt>
                      <dd className="text-sm font-medium text-[var(--sea-ink)]">
                        {listing.combinedCapacityLabel ||
                          (listing.combinedCapacityL != null
                            ? `${listing.combinedCapacityL} L`
                            : '—')}
                      </dd>
                    </div>
                  </div>
                </dl>
                <p className="mt-auto pt-2 text-xs text-[var(--sea-ink-soft)]">
                  Edit these under the Website tab.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card size="sm" className="h-full">
              <CardHeader className="pb-0">
                <CardDescription className="island-kicker">Listing flags</CardDescription>
                <CardTitle className="sr-only">Listing flags</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2 text-sm">
                <p>
                  <span className="text-[var(--sea-ink-soft)]">Bookable: </span>
                  <span className="font-medium text-[var(--sea-ink)]">
                    {listing.availableForBooking ? 'Yes' : 'No'}
                  </span>
                </p>
                <p>
                  <span className="text-[var(--sea-ink-soft)]">Featured: </span>
                  <span className="font-medium text-[var(--sea-ink)]">
                    {listing.featured ? 'Yes' : 'No'}
                  </span>
                </p>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  Self-owned capacity, partner supply, website, and pricing for this model are
                  managed in the tabs above.
                </p>
              </CardContent>
            </Card>

            <Card size="sm" className="h-full">
              <CardHeader className="pb-0">
                <CardDescription className="island-kicker">Vehicles in this model</CardDescription>
                <CardTitle className="sr-only">Physical plates</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-[var(--sea-ink-soft)]">No active vehicles.</p>
                ) : (
                  <ul className="divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
                    {vehicles.map((unit) => (
                      <li
                        key={unit.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <Link
                            to="/admin/cars/$carId"
                            params={{ carId: unit.id }}
                            className="font-mono font-semibold text-[var(--lagoon-deep,var(--sea-ink))] hover:underline"
                          >
                            {unit.plateNumber}
                          </Link>
                          <span className="ml-2 text-xs text-[var(--sea-ink-soft)]">
                            ({COLOR_LABEL[unit.color]}) {unit.year}
                            {unit.ownedByFleet ? '' : ' · Partner stock'}
                          </span>
                        </div>
                        <StatusBadge status={unit.status} size="sm" />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capacity" className="flex flex-col gap-3">
          <CarCapacityPanel
            carId={listing.id}
            canEdit={isOwner}
            section="owned"
            onCapacitySynced={async () => {
              const refreshed = await getCarModelByListingId({ data: { carId: listing.id } })
              setVehicles(refreshed.vehicles)
              const nextListing = await getCarById({ data: { carId: listing.id } })
              if (nextListing) setListing(nextListing)
            }}
          />
        </TabsContent>

        <TabsContent value="partner" className="flex flex-col gap-3">
          <CarCapacityPanel
            carId={listing.id}
            canEdit={isOwner}
            section="partner"
          />
        </TabsContent>

        <TabsContent value="website" className="flex flex-col gap-4">
          <CarWebsitePanel
            car={listing}
            canEdit={isOwner}
            onSaved={(updated) => setListing((prev) => ({ ...prev, ...updated }))}
          />
        </TabsContent>

        <TabsContent value="photos" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardDescription className="island-kicker">Media</CardDescription>
              <CardTitle className="text-base">Model photos</CardTitle>
            </CardHeader>
            <CardContent>
              {photosLoading || photos === null ? (
                <p className="text-sm text-[var(--sea-ink-soft)]">Loading photos…</p>
              ) : isOwner ? (
                <CarPhotoManager key={listing.id} carId={listing.id} initialPhotos={photos} />
              ) : (
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Only owners can manage photos.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="flex flex-col gap-4">
          <CarPricingPanel
            car={listing}
            canEdit={isOwner}
            onSaved={(updated) => setListing((prev) => ({ ...prev, ...updated }))}
          />
        </TabsContent>
      </Tabs>
    </AdminSidebarShell>
  )
}
