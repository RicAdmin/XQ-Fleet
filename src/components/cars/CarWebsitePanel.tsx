import { useState } from 'react'

import { showAdminToast } from '#/components/ui/AdminToast'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { updateCarCatalog } from '#/lib/car-functions'

export type CarCatalogFields = {
  id: string
  slug: string | null
  featured: boolean
  availableForBooking: boolean
  ownedByFleet: boolean
  vendorName: string | null
  metaTitle: string | null
  metaDescription: string | null
  longDescription: string | null
  highlights: string[] | null
  bodyType: string | null
  passengers: number
  doors: number
  transmission: string | null
  fuelType: string | null
  appleCarPlay: boolean
  androidAuto: boolean
  bootCapacityL: number | null
  bootCapacityLabel: string | null
  largeSuitcasesCount: number | null
  smallCarryonsCount: number | null
  combinedCapacityL: number | null
  combinedCapacityLabel: string | null
  tagFunAdventure: boolean
  tagFamilyComfort: boolean
  tagSmallOku: boolean
  fuelPolicy: string | null
  carLocations: string | null
}

type Props = {
  car: CarCatalogFields
  canEdit: boolean
  onSaved: (car: CarCatalogFields) => void
}

function senOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

function CatalogSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="catalog-form__section">
      <header className="catalog-form__section-head">
        <h3 className="catalog-form__section-title">{title}</h3>
        {description ? (
          <p className="catalog-form__section-desc">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}

function CatalogToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="catalog-form__toggle" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="catalog-form__toggle-label">{label}</span>
      <span className="catalog-form__toggle-desc">{description}</span>
    </label>
  )
}

function CatalogChip({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="catalog-form__chip" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  )
}

export function CarWebsitePanel({ car, canEdit, onSaved }: Props) {
  const [form, setForm] = useState({
    slug: car.slug ?? '',
    featured: car.featured,
    availableForBooking: car.availableForBooking,
    ownedByFleet: car.ownedByFleet,
    vendorName: car.vendorName ?? '',
    metaTitle: car.metaTitle ?? '',
    metaDescription: car.metaDescription ?? '',
    longDescription: car.longDescription ?? '',
    highlights: (car.highlights ?? []).join('\n'),
    bodyType: car.bodyType ?? '',
    passengers: String(car.passengers),
    doors: String(car.doors),
    transmission: car.transmission ?? '',
    fuelType: car.fuelType ?? '',
    appleCarPlay: car.appleCarPlay,
    androidAuto: car.androidAuto,
    bootCapacityL: car.bootCapacityL != null ? String(car.bootCapacityL) : '',
    bootCapacityLabel: car.bootCapacityLabel ?? '',
    largeSuitcasesCount:
      car.largeSuitcasesCount != null ? String(car.largeSuitcasesCount) : '',
    smallCarryonsCount:
      car.smallCarryonsCount != null ? String(car.smallCarryonsCount) : '',
    combinedCapacityL:
      car.combinedCapacityL != null ? String(car.combinedCapacityL) : '',
    combinedCapacityLabel: car.combinedCapacityLabel ?? '',
    tagFunAdventure: car.tagFunAdventure,
    tagFamilyComfort: car.tagFamilyComfort,
    tagSmallOku: car.tagSmallOku,
    fuelPolicy: car.fuelPolicy ?? '',
    carLocations: car.carLocations ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!canEdit) return
    setError(null)
    setSaving(true)
    try {
      const highlights = form.highlights
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const updated = await updateCarCatalog({
        data: {
          carId: car.id,
          slug: form.slug,
          featured: form.featured,
          availableForBooking: form.availableForBooking,
          ownedByFleet: form.ownedByFleet,
          vendorName: form.vendorName,
          metaTitle: form.metaTitle,
          metaDescription: form.metaDescription,
          longDescription: form.longDescription,
          highlights: highlights.length ? highlights : null,
          bodyType: form.bodyType,
          passengers: Number(form.passengers) || 5,
          doors: Number(form.doors) || 4,
          transmission: form.transmission,
          fuelType: form.fuelType,
          appleCarPlay: form.appleCarPlay,
          androidAuto: form.androidAuto,
          bootCapacityL: senOptionalNumber(form.bootCapacityL),
          bootCapacityLabel: form.bootCapacityLabel,
          largeSuitcasesCount: senOptionalNumber(form.largeSuitcasesCount),
          smallCarryonsCount: senOptionalNumber(form.smallCarryonsCount),
          combinedCapacityL: senOptionalNumber(form.combinedCapacityL),
          combinedCapacityLabel: form.combinedCapacityLabel,
          tagFunAdventure: form.tagFunAdventure,
          tagFamilyComfort: form.tagFamilyComfort,
          tagSmallOku: form.tagSmallOku,
          fuelPolicy: form.fuelPolicy,
          carLocations: form.carLocations,
        },
      })
      onSaved({
        id: updated.id,
        slug: updated.slug,
        featured: updated.featured,
        availableForBooking: updated.availableForBooking,
        ownedByFleet: updated.ownedByFleet,
        vendorName: updated.vendorName,
        metaTitle: updated.metaTitle,
        metaDescription: updated.metaDescription,
        longDescription: updated.longDescription,
        highlights: updated.highlights,
        bodyType: updated.bodyType,
        passengers: updated.passengers,
        doors: updated.doors,
        transmission: updated.transmission,
        fuelType: updated.fuelType,
        appleCarPlay: updated.appleCarPlay,
        androidAuto: updated.androidAuto,
        bootCapacityL: updated.bootCapacityL,
        bootCapacityLabel: updated.bootCapacityLabel,
        largeSuitcasesCount: updated.largeSuitcasesCount,
        smallCarryonsCount: updated.smallCarryonsCount,
        combinedCapacityL: updated.combinedCapacityL,
        combinedCapacityLabel: updated.combinedCapacityLabel,
        tagFunAdventure: updated.tagFunAdventure,
        tagFamilyComfort: updated.tagFamilyComfort,
        tagSmallOku: updated.tagSmallOku,
        fuelPolicy: updated.fuelPolicy,
        carLocations: updated.carLocations,
      })
      showAdminToast('Website details saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription className="island-kicker">Website catalog</CardDescription>
        <CardTitle className="text-base">Listing & SEO</CardTitle>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Public listing copy, search metadata, and specs shown on the customer website.
        </p>
      </CardHeader>
      <CardContent>
        <form className="catalog-form" onSubmit={handleSave}>
          <CatalogSection
            title="Listing settings"
            description="Control how this vehicle appears and whether customers can book it online."
          >
            <div className="catalog-form__toggles">
              <CatalogToggle
                id="cw-owned"
                label="Owned by fleet"
                description="Priority stock — shown before partner vehicles."
                checked={form.ownedByFleet}
                disabled={!canEdit}
                onChange={(checked) => setField('ownedByFleet', checked)}
              />
              <CatalogToggle
                id="cw-available"
                label="Available for booking"
                description="Customers can select this model when searching."
                checked={form.availableForBooking}
                disabled={!canEdit}
                onChange={(checked) => setField('availableForBooking', checked)}
              />
              <CatalogToggle
                id="cw-featured"
                label="Featured on homepage"
                description="Highlight in the homepage carousel."
                checked={form.featured}
                disabled={!canEdit}
                onChange={(checked) => setField('featured', checked)}
              />
            </div>
          </CatalogSection>

          <CatalogSection
            title="URL & identity"
            description="The public URL slug and optional supplier label for partner-sourced vehicles."
          >
            <div className="catalog-form__grid catalog-form__grid--2">
              <div>
                <label className="field-label" htmlFor="cw-slug">
                  Slug
                </label>
                <input
                  id="cw-slug"
                  className="field-input"
                  value={form.slug}
                  disabled={!canEdit}
                  onChange={(e) => setField('slug', e.target.value)}
                  placeholder="perodua-axia"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cw-vendor">
                  Vendor name
                </label>
                <input
                  id="cw-vendor"
                  className="field-input"
                  value={form.vendorName}
                  disabled={!canEdit}
                  onChange={(e) => setField('vendorName', e.target.value)}
                  placeholder="Optional supplier label"
                />
              </div>
            </div>
          </CatalogSection>

          <CatalogSection
            title="Search & social"
            description="Title and description used in Google results and link previews."
          >
            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="cw-meta-title">
                  Meta title
                </label>
                <input
                  id="cw-meta-title"
                  className="field-input"
                  value={form.metaTitle}
                  disabled={!canEdit}
                  onChange={(e) => setField('metaTitle', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cw-meta-desc">
                  Meta description
                </label>
                <textarea
                  id="cw-meta-desc"
                  className="field-input"
                  rows={3}
                  value={form.metaDescription}
                  disabled={!canEdit}
                  onChange={(e) => setField('metaDescription', e.target.value)}
                />
              </div>
            </div>
          </CatalogSection>

          <CatalogSection
            title="Page content"
            description="Main copy and bullet highlights on the vehicle detail page."
          >
            <div className="space-y-4">
              <div>
                <label className="field-label" htmlFor="cw-long">
                  Long description
                </label>
                <textarea
                  id="cw-long"
                  className="field-input field-input--tall"
                  rows={5}
                  value={form.longDescription}
                  disabled={!canEdit}
                  onChange={(e) => setField('longDescription', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="cw-highlights">
                  Highlights
                </label>
                <p className="mb-2 text-xs text-[var(--sea-ink-soft)]">One per line</p>
                <textarea
                  id="cw-highlights"
                  className="field-input"
                  rows={4}
                  value={form.highlights}
                  disabled={!canEdit}
                  onChange={(e) => setField('highlights', e.target.value)}
                  placeholder={'Most fuel-efficient\nEasy to park\nLowest daily rate'}
                />
              </div>
            </div>
          </CatalogSection>

          <CatalogSection
            title="Specifications"
            description="Vehicle attributes shown in the specs table on the listing page."
          >
            <div className="space-y-4">
              <div className="catalog-form__grid catalog-form__grid--4">
                <div>
                  <label className="field-label" htmlFor="cw-passengers">
                    Passengers
                  </label>
                  <input
                    id="cw-passengers"
                    type="number"
                    className="field-input"
                    min={1}
                    max={20}
                    value={form.passengers}
                    disabled={!canEdit}
                    onChange={(e) => setField('passengers', e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-doors">
                    Doors
                  </label>
                  <input
                    id="cw-doors"
                    type="number"
                    className="field-input"
                    min={2}
                    max={6}
                    value={form.doors}
                    disabled={!canEdit}
                    onChange={(e) => setField('doors', e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-body">
                    Body type
                  </label>
                  <input
                    id="cw-body"
                    className="field-input"
                    value={form.bodyType}
                    disabled={!canEdit}
                    onChange={(e) => setField('bodyType', e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-trans">
                    Transmission
                  </label>
                  <input
                    id="cw-trans"
                    className="field-input"
                    value={form.transmission}
                    disabled={!canEdit}
                    onChange={(e) => setField('transmission', e.target.value)}
                  />
                </div>
              </div>

              <div className="catalog-form__grid catalog-form__grid--2">
                <div>
                  <label className="field-label" htmlFor="cw-fuel">
                    Fuel type
                  </label>
                  <input
                    id="cw-fuel"
                    className="field-input"
                    value={form.fuelType}
                    disabled={!canEdit}
                    onChange={(e) => setField('fuelType', e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-fuel-policy">
                    Fuel policy
                  </label>
                  <input
                    id="cw-fuel-policy"
                    className="field-input"
                    value={form.fuelPolicy}
                    disabled={!canEdit}
                    onChange={(e) => setField('fuelPolicy', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="cw-locations">
                  Locations note
                </label>
                <input
                  id="cw-locations"
                  className="field-input"
                  value={form.carLocations}
                  disabled={!canEdit}
                  onChange={(e) => setField('carLocations', e.target.value)}
                  placeholder="e.g. Airport, Kuah jetty, Pantai Cenang hotels"
                />
              </div>
            </div>
          </CatalogSection>

          <CatalogSection
            title="Luggage & boot"
            description="Suitcase and boot figures shown on the public listing and fit finder."
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="field-label" htmlFor="cw-suitcases">
                    Large suitcases
                  </label>
                  <input
                    id="cw-suitcases"
                    type="number"
                    min={0}
                    max={20}
                    className="field-input"
                    value={form.largeSuitcasesCount}
                    disabled={!canEdit}
                    onChange={(e) => setField('largeSuitcasesCount', e.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-carryons">
                    Small carry-ons
                  </label>
                  <input
                    id="cw-carryons"
                    type="number"
                    min={0}
                    max={20}
                    className="field-input"
                    value={form.smallCarryonsCount}
                    disabled={!canEdit}
                    onChange={(e) => setField('smallCarryonsCount', e.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-boot-l">
                    Boot capacity (L)
                  </label>
                  <input
                    id="cw-boot-l"
                    type="number"
                    min={0}
                    className="field-input"
                    value={form.bootCapacityL}
                    disabled={!canEdit}
                    onChange={(e) => setField('bootCapacityL', e.target.value)}
                    placeholder="e.g. 420"
                  />
                </div>
              </div>

              <div className="catalog-form__grid catalog-form__grid--2">
                <div>
                  <label className="field-label" htmlFor="cw-boot-label">
                    Boot capacity label
                  </label>
                  <input
                    id="cw-boot-label"
                    className="field-input"
                    value={form.bootCapacityLabel}
                    disabled={!canEdit}
                    onChange={(e) => setField('bootCapacityLabel', e.target.value)}
                    placeholder="e.g. 420 L"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cw-combined-l">
                    Combined capacity (L)
                  </label>
                  <input
                    id="cw-combined-l"
                    type="number"
                    min={0}
                    className="field-input"
                    value={form.combinedCapacityL}
                    disabled={!canEdit}
                    onChange={(e) => setField('combinedCapacityL', e.target.value)}
                    placeholder="e.g. 900"
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="cw-combined-label">
                  Combined capacity label
                </label>
                <input
                  id="cw-combined-label"
                  className="field-input"
                  value={form.combinedCapacityLabel}
                  disabled={!canEdit}
                  onChange={(e) => setField('combinedCapacityLabel', e.target.value)}
                  placeholder="e.g. ≈ 900 L with seats down"
                />
              </div>
            </div>
          </CatalogSection>

          <CatalogSection
            title="Features & tags"
            description="Amenities and audience tags used for filtering and badges."
          >
            <div className="catalog-form__chips">
              <CatalogChip
                id="cw-carplay"
                label="Apple CarPlay"
                checked={form.appleCarPlay}
                disabled={!canEdit}
                onChange={(checked) => setField('appleCarPlay', checked)}
              />
              <CatalogChip
                id="cw-android"
                label="Android Auto"
                checked={form.androidAuto}
                disabled={!canEdit}
                onChange={(checked) => setField('androidAuto', checked)}
              />
              <CatalogChip
                id="cw-tag-fun"
                label="Fun / adventure"
                checked={form.tagFunAdventure}
                disabled={!canEdit}
                onChange={(checked) => setField('tagFunAdventure', checked)}
              />
              <CatalogChip
                id="cw-tag-family"
                label="Family comfort"
                checked={form.tagFamilyComfort}
                disabled={!canEdit}
                onChange={(checked) => setField('tagFamilyComfort', checked)}
              />
              <CatalogChip
                id="cw-tag-oku"
                label="Small / OKU"
                checked={form.tagSmallOku}
                disabled={!canEdit}
                onChange={(checked) => setField('tagSmallOku', checked)}
              />
            </div>
          </CatalogSection>

          {canEdit ? (
            <div className="catalog-form__footer">
              <div>{error ? <p className="form-error">{error}</p> : null}</div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save website details'}
              </Button>
            </div>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
