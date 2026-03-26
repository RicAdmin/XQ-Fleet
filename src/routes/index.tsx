import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Calendar, Car, MapPin } from 'lucide-react'

import Footer from '#/components/Footer'
import ThemeToggle from '#/components/ThemeToggle'
import { filterPublicCars, getPublicCars, type PublicCarRow } from '#/lib/portal-functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const cars = await getPublicCars()
    return { cars }
  },
  component: LandingPage,
})

const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '🚗' },
  { value: 'economy', label: 'Economy', emoji: '🚙' },
  { value: 'mpv', label: 'MPV', emoji: '🚐' },
  { value: 'suv', label: 'SUV', emoji: '🛻' },
  { value: 'other', label: 'Other', emoji: '🚕' },
] as const

function formatMYR(sen: number) {
  return `RM ${Math.round(sen / 100).toLocaleString()}`
}

function estimateDays(start: string, end: string) {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return ms > 0 ? Math.ceil(ms / 86_400_000) : null
}

function LandingPage() {
  const { cars: initialCars } = Route.useRouteContext() as { cars: PublicCarRow[] }

  const [cars, setCars] = useState<PublicCarRow[]>(initialCars)
  const [category, setCategory] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filtering, setFiltering] = useState(false)
  const [filtered, setFiltered] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const estimatedDays = estimateDays(startDate, endDate)

  async function search() {
    setFiltering(true)
    try {
      const results = await filterPublicCars({
        data: {
          category: category === 'all' ? undefined : category,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      })
      setCars(results)
      setFiltered(true)
    } finally {
      setFiltering(false)
    }
  }

  function reset() {
    setCategory('all')
    setStartDate('')
    setEndDate('')
    setCars(initialCars)
    setFiltered(false)
  }

  return (
    <div className="landing-root">
      {/* ── Full-viewport hero ──────────────────────────── */}
      <section className="landing-hero">

        {/* Floating nav */}
        <nav className="landing-nav">
          <div className="landing-nav-inner page-wrap px-4">
            <Link to="/" className="landing-brand">XQ Car Fleet</Link>
            <div className="landing-nav-links">
              <Link to="/about" className="landing-nav-link">About</Link>
              <Link to="/login" className="landing-nav-link">Customer login</Link>
              <Link to="/internal/login" className="landing-nav-link">Staff</Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Hero text */}
        <div className="landing-hero-body page-wrap px-4">
          <p className="landing-kicker">
            <MapPin size={11} strokeWidth={2.5} />
            Langkawi Island, Malaysia
          </p>
          <h1 className="landing-title">
            Your keys<br />to the <em>island.</em>
          </h1>
          <p className="landing-subtitle">
            Well-maintained cars, ready for pickup. Browse our fleet and find the perfect ride for your Langkawi escape.
          </p>
        </div>

        {/* Search card — sits at the base of the hero, overlapping the arc */}
        <div className="landing-search-wrap page-wrap px-4">
          <div className="landing-search-card">
            <div className="landing-cat-pills">
              {CATEGORIES.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`landing-cat-pill${category === value ? ' is-active' : ''}`}
                >
                  <span aria-hidden="true">{emoji}</span>
                  {label}
                </button>
              ))}
            </div>

            <div className="landing-date-row">
              <div className="landing-date-field">
                <label className="landing-date-label">
                  <Calendar size={12} strokeWidth={2.5} aria-hidden="true" />
                  Pickup date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (endDate && e.target.value > endDate) setEndDate('')
                  }}
                  className="landing-date-input"
                />
              </div>

              <div className="landing-date-sep" aria-hidden="true">→</div>

              <div className="landing-date-field">
                <label className="landing-date-label">
                  <Calendar size={12} strokeWidth={2.5} aria-hidden="true" />
                  Return date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="landing-date-input"
                />
              </div>

              <button
                type="button"
                onClick={search}
                disabled={filtering}
                className="landing-search-btn"
              >
                {filtering ? 'Searching…' : 'Find available cars'}
              </button>
            </div>
          </div>
        </div>

        <div className="portal-hero-arc" aria-hidden="true" />
      </section>

      {/* ── Fleet browse ────────────────────────────────── */}
      <section id="browse" className="landing-browse page-wrap px-4">
        <div className="landing-results-bar">
          <span className="portal-results-count">
            <strong>{cars.length}</strong>{' '}
            {cars.length === 1 ? 'vehicle' : 'vehicles'}
            {filtered && startDate && endDate ? ' available for your dates' : ' in fleet'}
          </span>
          <div className="landing-results-end">
            {estimatedDays && (
              <span className="portal-results-days">{estimatedDays}-day rental</span>
            )}
            {filtered && (
              <button type="button" onClick={reset} className="landing-clear-btn">
                Clear
              </button>
            )}
          </div>
        </div>

        {cars.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty-icon">🔍</p>
            <p className="portal-empty-title">No vehicles found</p>
            <p className="portal-empty-sub">Try different dates or remove category filters.</p>
            <button type="button" onClick={reset} className="button-secondary">
              Clear search
            </button>
          </div>
        ) : (
          <div className="landing-grid">
            {cars.map((car) => (
              <CarCard key={car.id} car={car} days={estimatedDays} startDate={startDate} endDate={endDate} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}

function CarCard({
  car,
  days,
  startDate,
  endDate,
}: {
  car: PublicCarRow
  days: number | null
  startDate: string
  endDate: string
}) {
  return (
    <div className="landing-car-card">
      <Link to="/cars/$carId" params={{ carId: car.id }} className="landing-car-photo-link">
        <div className="landing-car-photo">
          {car.coverPhotoUrl ? (
            <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} className="landing-car-img" />
          ) : (
            <div className="landing-car-no-photo">
              <Car size={32} />
            </div>
          )}
          <span className="landing-car-cat">{car.category}</span>
        </div>
        <div className="landing-car-body">
          <p className="landing-car-year">{car.year}</p>
          <h3 className="landing-car-name">
            {car.make} {car.model}
          </h3>
          <div className="landing-car-price">
            <span className="landing-car-rate">{formatMYR(car.dailyRateSen)}</span>
            <span className="landing-car-unit">/day</span>
            {days && <span className="landing-car-est">· est. {formatMYR(car.dailyRateSen * days)}</span>}
          </div>
        </div>
      </Link>
      <div className="landing-car-actions">
        <Link
          to="/book/$carId"
          params={{ carId: car.id }}
          search={{ startDate: startDate || undefined, endDate: endDate || undefined }}
          className="button-primary landing-book-btn"
        >
          Book now
        </Link>
        <Link to="/cars/$carId" params={{ carId: car.id }} className="landing-details-link">
          Details →
        </Link>
      </div>
    </div>
  )
}
