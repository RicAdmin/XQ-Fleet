import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Car, ChevronDown, MapPin, SlidersHorizontal } from 'lucide-react'

import PublicPageShell from '#/components/shells/PublicPageShell'
import { filterPublicCars, getPublicCars, type PublicCarRow } from '#/lib/portal-functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const cars = await getPublicCars()
    return { cars }
  },
  component: LandingPage,
})

const CATEGORIES = [
  { value: 'all', label: 'All vehicles', emoji: '🚗' },
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
    <PublicPageShell className="">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="portal-hero">
        <div className="portal-hero-inner page-wrap px-4">
          <p className="portal-hero-kicker">
            <MapPin size={11} strokeWidth={2.5} />
            Langkawi Island, Malaysia
          </p>
          <h1 className="portal-hero-title">
            Your keys to<br />
            <em>the island.</em>
          </h1>
          <p className="portal-hero-sub">
            Well-maintained cars ready for pickup. Browse our fleet and find the perfect ride.
          </p>
          <a href="#browse" className="portal-hero-cta">
            Explore vehicles
            <ChevronDown size={16} strokeWidth={2.5} />
          </a>
        </div>
        <div className="portal-hero-arc" aria-hidden="true" />
      </section>

      {/* ── Browse ───────────────────────────────────────── */}
      <section id="browse" className="page-wrap px-4 py-10">
        <div className="portal-layout">

          {/* Sidebar */}
          <aside className="portal-sidebar">
            <div className="portal-filter-card">
              <div className="portal-filter-title">
                <SlidersHorizontal size={14} strokeWidth={2.5} />
                Search
              </div>

              <div className="portal-filter-section">
                <p className="portal-filter-label">Category</p>
                <div className="portal-cat-grid">
                  {CATEGORIES.map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={`portal-cat-btn${category === value ? ' is-active' : ''}`}
                    >
                      <span className="portal-cat-emoji">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="portal-filter-section">
                <p className="portal-filter-label">Pickup date</p>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    if (endDate && e.target.value > endDate) setEndDate('')
                  }}
                  className="portal-date-input"
                />
              </div>

              <div className="portal-filter-section">
                <p className="portal-filter-label">Return date</p>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="portal-date-input"
                />
              </div>

              <button
                type="button"
                onClick={search}
                disabled={filtering}
                className="button-primary w-full justify-center"
              >
                {filtering ? 'Searching…' : 'Find available cars'}
              </button>

              {filtered && (
                <button type="button" onClick={reset} className="portal-clear-btn">
                  Clear search
                </button>
              )}
            </div>
          </aside>

          {/* Results */}
          <main>
            <div className="portal-results-bar">
              <span className="portal-results-count">
                <strong>{cars.length}</strong>{' '}
                {cars.length === 1 ? 'vehicle' : 'vehicles'}
                {filtered && startDate && endDate
                  ? ' available for your dates'
                  : ' in fleet'}
              </span>
              {estimatedDays && (
                <span className="portal-results-days">
                  {estimatedDays}-day rental
                </span>
              )}
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
              <div className="portal-grid">
                {cars.map((car) => (
                  <CarCard key={car.id} car={car} days={estimatedDays} startDate={startDate} endDate={endDate} />
                ))}
              </div>
            )}
          </main>
        </div>
      </section>
    </PublicPageShell>
  )
}

function CarCard({ car, days, startDate, endDate }: { car: PublicCarRow; days: number | null; startDate: string; endDate: string }) {
  return (
    <div className="portal-car-card">
      <Link to="/cars/$carId" params={{ carId: car.id }} className="portal-car-card-inner">
        <div className="portal-car-photo">
          {car.coverPhotoUrl
            ? <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} className="portal-car-img" />
            : (
              <div className="portal-car-no-photo">
                <Car size={28} />
              </div>
            )}
          <span className="portal-car-badge">{car.category}</span>
        </div>
        <div className="portal-car-body">
          <p className="portal-car-year">{car.year}</p>
          <h3 className="portal-car-name">{car.make} {car.model}</h3>
          <div className="portal-car-pricing">
            <span className="portal-car-rate">
              {formatMYR(car.dailyRateSen)}
              <span className="portal-car-unit">/day</span>
            </span>
            {days && (
              <span className="portal-car-est">
                est. {formatMYR(car.dailyRateSen * days)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="portal-car-actions">
        <Link
          to="/book/$carId"
          params={{ carId: car.id }}
          search={{ startDate: startDate || undefined, endDate: endDate || undefined }}
          className="button-primary portal-car-book-btn"
        >
          Book
        </Link>
        <Link to="/cars/$carId" params={{ carId: car.id }} className="portal-car-detail-link">
          Details →
        </Link>
      </div>
    </div>
  )
}
