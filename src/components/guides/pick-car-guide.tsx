import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Car, DoorOpen, Luggage, Sparkles, Users } from 'lucide-react'

import type { CarCategory } from '#/db/schema'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'

import { LuggageFitModal } from '#/components/LuggageFitModal'
import {
  CarDetailDialog,
  defaultBooking,
  nightsBetween,
} from '#/components/landing/CarDetailDialog'

import { GuidePageHeader, GuidePageShell } from './guide-shell'

function toYmd(d: Date | null) {
  if (!d) return undefined
  return d.toISOString().slice(0, 10)
}

const GROUP_TABS = ['all', 'Small', 'Comfort', 'Adventure'] as const
type GroupTab = (typeof GROUP_TABS)[number]

function heuristicFit(category: CarCategory) {
  return heuristicLuggageFit(category)
}

function carMatchesTab(car: PublicCarRow, tab: GroupTab) {
  if (tab === 'all') return true
  if (tab === 'Small') return car.category === 'economy'
  if (tab === 'Comfort') return car.category === 'economy' || car.category === 'mpv'
  if (tab === 'Adventure') return car.category === 'suv' || car.category === 'other'
  return true
}

function bestForLine(car: PublicCarRow) {
  const n = car.notes?.trim()
  if (n) return n
  switch (car.category) {
    case 'economy':
      return 'City runs, airport hops, and light luggage — easy to park and kind on fuel.'
    case 'mpv':
      return 'Families and small groups who want sliding doors, upright seating, and room for bags.'
    case 'suv':
      return 'Mixed roads, light trails, and higher seating — great when you want confidence and space.'
    default:
      return 'Versatile island daily driver for errands, beaches, and everything in between.'
  }
}

function paxChip(category: CarCategory) {
  switch (category) {
    case 'economy':
      return '1–4 adults typical'
    case 'mpv':
      return '4–7 adults typical'
    case 'suv':
      return '2–5 adults typical'
    default:
      return '2–5 adults typical'
  }
}

function suitedChips(category: CarCategory): string[] {
  switch (category) {
    case 'economy':
      return ['Couples', 'Short trips', 'First timers']
    case 'mpv':
      return ['Families', 'School holidays', 'Airport runs']
    case 'suv':
      return ['Scenic drives', 'Weekend exploring']
    default:
      return ['Mixed trips', 'Small groups']
  }
}

function formatMYR(sen: number) {
  return `RM ${Math.round(sen / 100).toLocaleString()}`
}

export function PickCarGuide({ cars }: { cars: PublicCarRow[] }) {
  const navigate = useNavigate()
  const [booking] = useState(defaultBooking)
  const [tab, setTab] = useState<GroupTab>('all')
  const [size, setSize] = useState<'any' | 'small' | 'mid' | 'big'>('any')
  const [bags, setBags] = useState(0)
  const [pax, setPax] = useState(0)
  const [luggageCar, setLuggageCar] = useState<PublicCarRow | null>(null)
  const [detailCar, setDetailCar] = useState<PublicCarRow | null>(null)

  const filtered = useMemo(() => {
    return cars.filter((c) => {
      if (!carMatchesTab(c, tab)) return false
      const fit = heuristicFit(c.category)
      if (pax && fit.seats < pax) return false
      if (bags && fit.lg + fit.sm < bags) return false
      if (size === 'small' && fit.seats > 5) return false
      if (size === 'mid' && (fit.seats < 5 || fit.seats > 7)) return false
      if (size === 'big' && fit.seats < 8) return false
      return true
    })
  }, [cars, tab, size, bags, pax])

  const tabCount = (g: GroupTab) => {
    if (g === 'all') return cars.length
    return cars.filter((c) => carMatchesTab(c, g)).length
  }

  const goToCheckout = useCallback(
    (car: PublicCarRow) => {
      setDetailCar(null)
      void navigate({
        to: '/checkout/$carId',
        params: { carId: car.id },
        search: {
          startDate: toYmd(booking.pickDate),
          endDate: toYmd(booking.retDate),
          from: booking.from,
          retLoc: booking.retLoc,
          tripType: booking.tripType,
          pickTime: booking.pickTime,
          retTime: booking.retTime,
          adults: String(booking.adults),
          children: String(booking.children),
        },
      })
    },
    [navigate, booking],
  )

  return (
    <GuidePageShell>
      <GuidePageHeader
        kicker="Buyers' guide"
        title="Pick the right car & luggage fit guide."
        body="A car-by-car comparison made for trips to Langkawi. Filter by group size, by luggage, by how you'll use the car — and see exactly what fits before you book."
      />

      <section className="page-section">
        <div className="prc-toolbar">
          <div className="prc-tabs">
            {GROUP_TABS.map((g) => (
              <button key={g} type="button" className={'prc-tab' + (tab === g ? ' on' : '')} onClick={() => setTab(g)}>
                {g === 'all' ? 'All cars' : g}
                <span>{tabCount(g)}</span>
              </button>
            ))}
          </div>
          <div className="prc-filters">
            <div className="prc-filter">
              <span>Group size</span>
              <div className="prc-stepper">
                <button type="button" onClick={() => setPax(Math.max(0, pax - 1))} disabled={pax === 0}>
                  −
                </button>
                <strong>{pax || 'Any'}</strong>
                <button type="button" onClick={() => setPax(pax + 1)} disabled={pax >= 14}>
                  +
                </button>
              </div>
            </div>
            <div className="prc-filter">
              <span>Luggage</span>
              <div className="prc-stepper">
                <button type="button" onClick={() => setBags(Math.max(0, bags - 1))} disabled={bags === 0}>
                  −
                </button>
                <strong>{bags || 'Any'}</strong>
                <button type="button" onClick={() => setBags(bags + 1)} disabled={bags >= 14}>
                  +
                </button>
              </div>
            </div>
            <div className="prc-filter">
              <span>Car size</span>
              <select className="sort-select" value={size} onChange={(e) => setSize(e.target.value as typeof size)}>
                <option value="any">Any</option>
                <option value="small">Small (≤ 5)</option>
                <option value="mid">Mid (5–7)</option>
                <option value="big">Big (8+)</option>
              </select>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setTab('all')
                setSize('any')
                setBags(0)
                setPax(0)
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <p className="prc-count">
          <Sparkles size={13} /> Showing <strong>{filtered.length}</strong> car{filtered.length === 1 ? '' : 's'} for your trip
        </p>

        <div className="prc-list">
          {filtered.map((c, idx) => {
            const fit = heuristicFit(c.category)
            const score = Math.min(5, Math.round((fit.seats + fit.lg + fit.sm) / 4))
            const displayTag = c.category.charAt(0).toUpperCase() + c.category.slice(1)
            return (
              <article key={c.id} className="prc-row">
                <span className="prc-row-num">{String(idx + 1).padStart(2, '0')}</span>

                <div className="prc-row-img">
                  <span className="prc-card-tag">{displayTag}</span>
                  {c.coverPhotoUrl ? (
                    <img src={c.coverPhotoUrl} alt={`${c.make} ${c.model}`} loading="lazy" />
                  ) : (
                    <div className="flex center" style={{ minHeight: 200, color: 'var(--muted)' }}>
                      No photo
                    </div>
                  )}
                  <span className="prc-score" title="Trip-fit rating (illustrative)">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < score ? 'on' : ''} />
                    ))}
                    <em>Trip-fit</em>
                  </span>
                </div>

                <div className="prc-row-body">
                  <header>
                    <div>
                      <span className="eyebrow" style={{ color: 'var(--brand-leaf)' }}>
                        {fit.groups.join(' · ')}
                      </span>
                      <h3>
                        {c.make} {c.model}
                      </h3>
                      <span className="prc-card-meta">
                        {displayTag} · Auto · Petrol
                      </span>
                    </div>
                    <div className="prc-card-price">
                      <span>From</span>
                      <strong>
                        {formatMYR(c.dailyRateSen)}
                        <em>/day</em>
                      </strong>
                    </div>
                  </header>

                  <div className="prc-use">
                    <span className="eyebrow">Best for</span>
                    <p>{bestForLine(c)}</p>
                    <div className="prc-use-tags">
                      <span className="chip">{paxChip(c.category)}</span>
                      {suitedChips(c.category).map((s) => (
                        <span key={s} className="chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="prc-card-fit">
                    <div className="prc-fit-row">
                      <span className="prc-fit-lbl">
                        <Users size={12} /> Passengers
                      </span>
                      <strong>{fit.seats}</strong>
                      <em>seats</em>
                    </div>
                    <div className="prc-fit-row">
                      <span className="prc-fit-lbl">
                        <Luggage size={12} /> Big bags
                      </span>
                      <strong>{fit.lg}</strong>
                      <em>75 L check-in</em>
                    </div>
                    <div className="prc-fit-row">
                      <span className="prc-fit-lbl">
                        <Luggage size={12} /> Small bags
                      </span>
                      <strong>{fit.sm}</strong>
                      <em>35 L cabin</em>
                    </div>
                    <div className="prc-fit-row">
                      <span className="prc-fit-lbl">
                        <Car size={12} /> Boot
                      </span>
                      <strong style={{ fontSize: 16 }}>{fit.boot}</strong>
                    </div>
                    <div className="prc-fit-row">
                      <span className="prc-fit-lbl">
                        <DoorOpen size={12} /> Doors
                      </span>
                      <strong>{fit.doors}</strong>
                      <em>doors</em>
                    </div>
                  </div>

                  <footer>
                    <button type="button" className="btn btn-ghost" onClick={() => setLuggageCar(c)}>
                      <Luggage size={13} /> See luggage fit
                    </button>
                    <button
                      type="button"
                      className="btn btn-leaf"
                      onClick={() => {
                        setDetailCar(c)
                      }}
                    >
                      Rent {(c.model.split(/\s+/).filter(Boolean).pop() ?? c.model)}{' '}
                      <ArrowRight size={13} />
                    </button>
                  </footer>
                </div>
              </article>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="prc-empty">
            <h3>No cars match your trip parameters.</h3>
            <p>Try lowering the group size or luggage filter.</p>
            <button
              type="button"
              className="btn btn-leaf"
              onClick={() => {
                setPax(0)
                setBags(0)
                setSize('any')
                setTab('all')
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </section>

      {luggageCar && <LuggageFitModal car={luggageCar} onClose={() => setLuggageCar(null)} />}
      {detailCar && (
        <CarDetailDialog
          car={detailCar}
          fleet={cars}
          booking={booking}
          nights={nightsBetween(booking.pickDate, booking.retDate)}
          onClose={() => setDetailCar(null)}
          onBeginCheckout={goToCheckout}
          onSelectCar={setDetailCar}
        />
      )}
    </GuidePageShell>
  )
}
