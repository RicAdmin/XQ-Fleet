import { useMemo, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, Fuel, MapPin, Phone, Settings2, Shield, Sparkles, Star, X } from 'lucide-react'

import { LuggageFitModal } from '#/components/LuggageFitModal'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'

function defaultBookingDates() {
  const pick = new Date()
  pick.setDate(pick.getDate() + 5)
  pick.setHours(0, 0, 0, 0)
  const ret = new Date()
  ret.setDate(ret.getDate() + 9)
  ret.setHours(0, 0, 0, 0)
  return { pick, ret }
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function PickCarDetailDialog({ car, onClose }: { car: PublicCarRow; onClose: () => void }) {
  const { pick, ret } = useMemo(() => defaultBookingDates(), [])
  const nights = Math.max(1, Math.round((ret.getTime() - pick.getTime()) / 86_400_000))
  const daily = Math.round(car.dailyRateSen / 100)
  const subtotal = daily * nights
  const discount = Math.round(subtotal * 0.15)
  const insurance = 18 * nights
  const total = subtotal - discount + insurance

  const fit = heuristicLuggageFit(car.category)
  const [angle, setAngle] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, z: 1 })
  const [showLuggage, setShowLuggage] = useState(false)

  const displayTag = car.category.charAt(0).toUpperCase() + car.category.slice(1)
  const heroSrc = car.coverPhotoUrl ?? ''

  const onHeroMove = (e: React.MouseEvent) => {
    if (!heroRef.current) return
    const r = heroRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: -py * 8, y: px * 12, z: 1.04 })
  }
  const onHeroLeave = () => setTilt({ x: 0, y: 0, z: 1 })

  const startYmd = pick.toISOString().slice(0, 10)
  const endYmd = ret.toISOString().slice(0, 10)

  return (
    <>
      <div className="results-overlay" role="presentation" onClick={onClose}>
        <div className="detail-dialog" role="dialog" aria-modal="true" aria-label="Vehicle details" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="close-btn" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </button>

          <div className="left">
            <span
              style={{
                alignSelf: 'flex-start',
                background: '#fff',
                padding: '5px 12px',
                border: '1px solid var(--line)',
                borderRadius: 999,
                fontSize: 12,
              }}
            >
              {displayTag} · {fit.groups.join(' · ')}
            </span>
            <div
              className="detail-hero"
              ref={heroRef}
              onMouseMove={onHeroMove}
              onMouseLeave={onHeroLeave}
              role="presentation"
            >
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt={`${car.make} ${car.model}`}
                  style={{
                    transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.z})`,
                  }}
                />
              ) : (
                <div style={{ padding: 48, color: 'var(--muted)' }}>No photo</div>
              )}
              <span className="detail-hero-shine" style={{ transform: `translate(${tilt.y * 1.5}%, ${tilt.x * 1.5}%)` }} />
            </div>
            {heroSrc ? (
              <div className="thumbs">
                {[0, 1, 2].map((i) => (
                  <button key={i} type="button" className={angle === i ? 'on' : ''} onClick={() => setAngle(i)} title="View">
                    <img src={heroSrc} alt="" style={{ width: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 13, marginTop: 12 }}>
              <span>
                <Shield size={12} /> Insurance included
              </span>
              <span>
                <Check size={12} /> Cancel free 48 h before
              </span>
              <span>
                <Sparkles size={12} /> Top-rated by guests
              </span>
            </div>
          </div>

          <div className="right">
            <div>
              <span className="eyebrow">
                {displayTag} · typical island spec
              </span>
              <h2
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 34,
                  lineHeight: 1.05,
                  margin: '4px 0 4px',
                  letterSpacing: '-.025em',
                }}
              >
                {car.make} {car.model}
              </h2>
              <div className="flex items-center gap-2">
                <span title="Guest rating" style={{ display: 'inline-flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} style={{ color: 'var(--brand-sun)' }} fill="currentColor" />
                  ))}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>· 4.9 · 11 verified rentals this month</span>
              </div>
            </div>

            <div className="spec-grid">
              <div className="spec">
                <span className="lbl">Passengers</span>
                <span className="val">
                  Up to {fit.seats} seats
                </span>
              </div>
              <div className="spec">
                <span className="lbl">Doors</span>
                <span className="val">
                  {fit.doors} doors
                </span>
              </div>
              <div className="spec">
                <span className="lbl">Transmission</span>
                <span className="val">
                  <Settings2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Auto · typical
                </span>
              </div>
              <div className="spec">
                <span className="lbl">Fuel</span>
                <span className="val">
                  <Fuel size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Petrol · typical
                </span>
              </div>
            </div>

            <div>
              <b style={{ fontSize: 14 }}>What&apos;s included</b>
              <ul style={{ paddingLeft: 18, margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.8 }}>
                <li>Third-Party Liability Insurance</li>
                <li>Free pickup at airport, jetty or hotel</li>
                <li>Unlimited island miles</li>
                <li>24/7 roadside assistance &amp; local SIM hand-out</li>
              </ul>
            </div>

            <div className="price-box">
              <div className="price-dates">
                <div className="price-leg">
                  <span className="price-leg-lbl">Sample pickup</span>
                  <strong>{fmt(pick)}</strong>
                  <em>10:30 AM</em>
                </div>
                <div className="price-leg-mid">
                  <span className="price-leg-days">
                    {nights} day{nights > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="price-leg">
                  <span className="price-leg-lbl">Sample return</span>
                  <strong>{fmt(ret)}</strong>
                  <em>04:30 PM</em>
                </div>
              </div>
              <div className="price-loc">
                <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Langkawi · sample dates
              </div>
              <div className="price-divider" />
              <div className="row">
                <span>
                  RM {daily} × {nights} day{nights > 1 ? 's' : ''}
                </span>
                <span className="v">RM {subtotal}</span>
              </div>
              <div className="row">
                <span>Early-bird discount</span>
                <span className="v" style={{ color: 'var(--brand-coral)' }}>
                  −RM {discount}
                </span>
              </div>
              <div className="row">
                <span>Insurance &amp; protection</span>
                <span className="v muted">RM {insurance}</span>
              </div>
              <div className="row total">
                <span>Total estimate</span>
                <span>RM {total}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/book/$carId"
                params={{ carId: car.id }}
                search={{ startDate: startYmd, endDate: endYmd }}
                className="btn btn-leaf btn-lg"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onClose}
              >
                Reserve this car <ArrowRight size={14} />
              </Link>
              <button type="button" className="btn btn-ghost btn-lg" onClick={onClose}>
                Keep browsing
              </button>
            </div>

            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowLuggage(true)}>
                Luggage fit guide
              </button>
              <Link to="/cars/$carId" params={{ carId: car.id }} className="btn btn-ghost btn-sm" onClick={onClose}>
                Full vehicle page
              </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>
              <Phone size={13} /> Questions? WhatsApp us — replies usually under 4 min.
            </div>
          </div>
        </div>
      </div>
      {showLuggage && <LuggageFitModal car={car} onClose={() => setShowLuggage(false)} />}
    </>
  )
}
