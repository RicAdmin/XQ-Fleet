import { useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Car } from 'lucide-react'

import PublicPageShell from '#/components/shells/PublicPageShell'
import { getPublicCarDetail, type PublicCarDetail } from '#/lib/portal-functions'

export const Route = createFileRoute('/cars/$carId')({
  beforeLoad: async ({ params }) => {
    const car = await getPublicCarDetail({ data: { carId: params.carId } })
    if (!car) throw notFound()
    return { car }
  },
  component: CarDetailPage,
})

const CATEGORY_LABELS: Record<string, string> = {
  economy: 'Economy',
  mpv: 'MPV',
  suv: 'SUV',
  other: 'Other',
}

function formatMYR(sen: number) {
  return `RM ${Math.round(sen / 100).toLocaleString()}`
}

function CarDetailPage() {
  const { car } = Route.useRouteContext() as { car: PublicCarDetail }

  const coverPhoto = car.photos.find((p) => p.isCover) ?? car.photos[0]

  const [activePhoto, setActivePhoto] = useState(coverPhoto?.url ?? null)

  return (
    <PublicPageShell className="">
      <div className="page-wrap px-4 py-8">
        {/* Back link */}
        <Link to="/" className="car-detail-back">
          <ArrowLeft size={15} />
          Back to fleet
        </Link>

        <div className="car-detail-layout">
          {/* ── Photos column ── */}
          <div className="car-detail-photos">
            {/* Main photo */}
            <div className="car-detail-main-photo">
              {activePhoto
                ? <img src={activePhoto} alt={`${car.make} ${car.model}`} className="car-detail-main-img" />
                : (
                  <div className="car-detail-no-photo">
                    <Car size={48} />
                    <p>No photo available</p>
                  </div>
                )}
            </div>

            {/* Gallery strip */}
            {car.photos.length > 1 && (
              <div className="car-detail-gallery">
                {car.photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActivePhoto(photo.url)}
                    className={`car-detail-thumb${activePhoto === photo.url ? ' is-active' : ''}`}
                  >
                    <img src={photo.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info column ── */}
          <div className="car-detail-info">
            <span className="car-detail-badge">{CATEGORY_LABELS[car.category] ?? car.category}</span>
            <h1 className="car-detail-title">{car.make} {car.model}</h1>
            <p className="car-detail-year">{car.year}</p>

            <div className="car-detail-rate-card">
              <span className="car-detail-rate">{formatMYR(car.dailyRateSen)}</span>
              <span className="car-detail-per">per day</span>
            </div>

            {car.notes && (
              <div className="car-detail-notes">
                <p className="car-detail-notes-label">Notes</p>
                <p className="car-detail-notes-text">{car.notes}</p>
              </div>
            )}

            {/* Booking stub */}
            <div className="car-detail-book-card">
              <div className="car-detail-book-header">
                <Calendar size={16} />
                <span>Reserve this vehicle</span>
              </div>
              <p className="car-detail-book-sub">
                To make a booking, please contact us directly. Our team will confirm availability and set everything up.
              </p>
              <a
                href="https://wa.me/601234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary w-full justify-center"
              >
                WhatsApp us to book
              </a>
              <Link to="/" className="button-secondary w-full justify-center">
                Back to fleet
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
