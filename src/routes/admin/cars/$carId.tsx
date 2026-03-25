import { useState } from 'react'

import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Pencil, X } from 'lucide-react'

import AdminSidebarShell from '#/components/shells/AdminSidebarShell'
import { CarPhotoManager } from '#/components/cars/CarPhotoManager'
import { StatusBadge } from '#/components/ui/StatusBadge'
import type { CarCategory, CarColor, CarStatus } from '#/db/schema'
import { getCarById, getCarPhotos, updateCar } from '#/lib/car-functions'

export const Route = createFileRoute('/admin/cars/$carId')({
  beforeLoad: async ({ params }) => {
    const car = await getCarById({ data: { carId: params.carId } })
    if (!car) throw notFound()
    const photos = await getCarPhotos({ data: { carId: params.carId } })
    return { car, photos }
  },
  component: CarDetailPage,
})

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS: { value: CarColor; label: string }[] = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'silver', label: 'Silver' },
  { value: 'grey', label: 'Grey' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'dark-blue', label: 'Dark Blue' },
  { value: 'maroon', label: 'Maroon' },
  { value: 'gold', label: 'Gold' },
  { value: 'beige', label: 'Beige' },
  { value: 'green', label: 'Green' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_OPTIONS: { value: CarCategory; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'mpv', label: 'MPV' },
  { value: 'suv', label: 'SUV' },
  { value: 'other', label: 'Other' },
]

const COLOR_LABEL: Record<CarColor, string> = Object.fromEntries(
  COLOR_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarColor, string>

const CATEGORY_LABEL: Record<CarCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
) as Record<CarCategory, string>

function formatMYR(sen: number) {
  return `RM ${(sen / 100).toFixed(2)}`
}

function currentYear() {
  return new Date().getFullYear()
}

type CarRow = {
  id: string
  plateNumber: string
  make: string
  model: string
  year: number
  color: CarColor
  category: CarCategory
  status: CarStatus
  dailyRateSen: number
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

type CarFormData = {
  plateNumber: string
  make: string
  model: string
  year: string
  color: CarColor
  category: CarCategory
  dailyRateRM: string
  notes: string
}

function carToForm(car: CarRow): CarFormData {
  return {
    plateNumber: car.plateNumber,
    make: car.make,
    model: car.model,
    year: String(car.year),
    color: car.color,
    category: car.category,
    dailyRateRM: (car.dailyRateSen / 100).toFixed(2),
    notes: car.notes ?? '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function CarDetailPage() {
  const { session, car: initialCar, photos: initialPhotos } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
    car: CarRow
    photos: import('#/lib/car-functions').CarPhotoRow[]
  }

  const isOwner = session.user.role === 'owner'

  const [car, setCar] = useState<CarRow>(initialCar)
  const [editOpen, setEditOpen] = useState(false)
  const [formData, setFormData] = useState<CarFormData>(carToForm(initialCar))
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField<K extends keyof CarFormData>(key: K, value: CarFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function openEdit() {
    setFormData(carToForm(car))
    setFormError(null)
    setEditOpen(true)
  }

  async function handleFormSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const updated = await updateCar({
        data: {
          carId: car.id,
          plateNumber: formData.plateNumber,
          make: formData.make,
          model: formData.model,
          year: Number(formData.year),
          color: formData.color,
          category: formData.category,
          dailyRateSen: Math.round(Number(formData.dailyRateRM) * 100),
          notes: formData.notes || undefined,
        },
      })
      setCar(updated as CarRow)
      setEditOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminSidebarShell user={session.user} pageTitle="Vehicle profile">
      {/* Back link */}
      <div className="mb-5">
        <Link
          to="/admin/cars"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]"
        >
          <ArrowLeft size={14} />
          Back to fleet
        </Link>
      </div>

      {/* Car header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="island-kicker mb-1">
            {car.category.toUpperCase()} · {car.year}
          </p>
          <h2 className="text-2xl font-semibold text-[var(--sea-ink)]">
            {car.make} {car.model}
          </h2>
          <p className="font-mono mt-1 text-sm font-semibold text-[var(--lagoon-deep)]">
            {car.plateNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={car.status} size="md" />
          {isOwner && car.status !== 'retired' && (
            <button
              type="button"
              className="button-secondary inline-flex items-center gap-1.5"
              onClick={openEdit}
            >
              <Pencil size={13} />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-3">Vehicle details</p>
          <dl className="space-y-3">
            {[
              { label: 'Plate number', value: car.plateNumber },
              { label: 'Make', value: car.make },
              { label: 'Model', value: car.model },
              { label: 'Year', value: car.year },
              { label: 'Color', value: COLOR_LABEL[car.color] },
              {
                label: 'Category',
                value: (
                  <span className={`category-pill category-pill--${car.category}`}>
                    {CATEGORY_LABEL[car.category]}
                  </span>
                ),
              },
              { label: 'Daily rate', value: formatMYR(car.dailyRateSen) },
            ].map(({ label, value }) => (
              <div key={label} className="summary-row">
                <dt className="text-sm text-[var(--sea-ink-soft)]">{label}</dt>
                <dd className="text-sm font-medium text-[var(--sea-ink)]">{value}</dd>
              </div>
            ))}
          </dl>
          {car.notes && (
            <div className="mt-4 border-t border-[var(--line)] pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--sea-ink-soft)]">Notes</p>
              <p className="text-sm text-[var(--sea-ink)]">{car.notes}</p>
            </div>
          )}
        </article>

        <article className="workspace-panel island-shell">
          <p className="island-kicker mb-3">Current status</p>
          <div className="flex items-center gap-3">
            <StatusBadge status={car.status} size="md" />
            <span className="text-sm text-[var(--sea-ink-soft)]">
              Last updated {car.updatedAt.toLocaleDateString()}
            </span>
          </div>

          <hr className="my-4 border-[var(--line)]" />

          <p className="island-kicker mb-3">Rental history</p>
          <div className="hub-empty-state">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Rental history will appear here once Stage 4 is complete.
            </p>
          </div>
        </article>
      </div>

      {/* Photos */}
      {isOwner && (
        <section className="workspace-panel island-shell mt-4 p-5">
          <CarPhotoManager carId={car.id} initialPhotos={initialPhotos} />
        </section>
      )}

      {/* ── Edit form overlay ── */}
      {isOwner && editOpen && (
        <div className="form-overlay" role="dialog" aria-modal="true">
          <div className="form-panel island-shell">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="island-kicker mb-1">Edit vehicle</p>
                <h3 className="text-xl font-semibold text-[var(--sea-ink)]">
                  {car.make} {car.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(23,58,64,0.08)]"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div>
                <label className="field-label" htmlFor="cd-plate">Plate number</label>
                <input
                  id="cd-plate"
                  type="text"
                  className="field-input uppercase"
                  value={formData.plateNumber}
                  onChange={(e) => setField('plateNumber', e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cd-make">Make</label>
                  <input
                    id="cd-make"
                    type="text"
                    className="field-input"
                    value={formData.make}
                    onChange={(e) => setField('make', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cd-model">Model</label>
                  <input
                    id="cd-model"
                    type="text"
                    className="field-input"
                    value={formData.model}
                    onChange={(e) => setField('model', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cd-year">Year</label>
                  <input
                    id="cd-year"
                    type="number"
                    className="field-input"
                    value={formData.year}
                    onChange={(e) => setField('year', e.target.value)}
                    min={1960}
                    max={currentYear() + 1}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="cd-color">Color</label>
                  <select
                    id="cd-color"
                    className="field-input"
                    value={formData.color}
                    onChange={(e) => setField('color', e.target.value as CarColor)}
                  >
                    {COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="cd-category">Category</label>
                  <select
                    id="cd-category"
                    className="field-input"
                    value={formData.category}
                    onChange={(e) => setField('category', e.target.value as CarCategory)}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="cd-rate">Daily rate (RM)</label>
                  <input
                    id="cd-rate"
                    type="number"
                    className="field-input"
                    value={formData.dailyRateRM}
                    onChange={(e) => setField('dailyRateRM', e.target.value)}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="cd-notes">Notes (optional)</label>
                <textarea
                  id="cd-notes"
                  className="field-input"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="Any additional notes about this vehicle…"
                />
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="button-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminSidebarShell>
  )
}
