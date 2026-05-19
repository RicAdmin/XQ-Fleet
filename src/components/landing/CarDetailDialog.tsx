import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, Luggage, MapPin, Phone, Shield, X } from 'lucide-react'

import { LuggageFitModal } from '#/components/LuggageFitModal'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'

export type TripType = 'round' | 'oneway'

export type BookingState = {
  from: string
  retLoc: string
  tripType: TripType
  pickDate: Date | null
  retDate: Date | null
  pickTime: string
  retTime: string
  adults: number
  children: number
}

export function defaultBooking(): BookingState {
  const d1 = new Date()
  d1.setDate(d1.getDate() + 5)
  d1.setHours(0, 0, 0, 0)
  const d2 = new Date()
  d2.setDate(d2.getDate() + 9)
  d2.setHours(0, 0, 0, 0)
  return {
    from: 'Langkawi Intl Airport · Door 3',
    retLoc: 'Langkawi Intl Airport · Door 3',
    tripType: 'round',
    pickDate: d1,
    retDate: d2,
    pickTime: '10:30 AM',
    retTime: '04:30 PM',
    adults: 2,
    children: 0,
  }
}

export function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return 0
  const ms = b.getTime() - a.getTime()
  return ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 0
}

export function CarDetailDialog({
  car,
  booking,
  nights,
  onClose,
  onBeginCheckout,
}: {
  car: PublicCarRow
  booking: BookingState
  nights: number
  onClose: () => void
  onBeginCheckout: (car: PublicCarRow) => void
}) {
  const [showLuggage, setShowLuggage] = useState(false)
  const n = nights || 1
  const daily = Math.round(car.dailyRateSen / 100)
  const subtotal = daily * n
  const discount = Math.round(subtotal * 0.15)
  const insurance = 18 * n
  const total = subtotal - discount + insurance
  const fmt = (d: Date | null) =>
    d ? d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'
  const lug = heuristicLuggageFit(car.category)

  return (
    <>
      <div className="results-overlay" role="presentation" onClick={onClose}>
        <div
          className="detail-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle details"
          onClick={(e) => e.stopPropagation()}
        >
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
              {car.category}
            </span>
            <div className="detail-hero">
              {car.coverPhotoUrl ? (
                <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} />
              ) : (
                <div style={{ padding: 40 }}>No photo</div>
              )}
            </div>
            <div
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--muted)', fontSize: 13, marginTop: 12 }}
            >
              <span>
                <Shield size={12} /> Insurance included
              </span>
              <span>
                <Check size={12} /> Cancel free 48 h before
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 14, alignSelf: 'flex-start' }}
              onClick={(e) => {
                e.stopPropagation()
                setShowLuggage(true)
              }}
            >
              <Luggage size={14} /> Luggage fit guide
            </button>
          </div>

          <div className="right">
            <div>
              <span className="eyebrow">{car.category}</span>
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
            </div>

            <div className="spec-grid">
              <div className="spec">
                <span className="lbl">Year</span>
                <span className="val">{car.year}</span>
              </div>
              <div className="spec">
                <span className="lbl">Category</span>
                <span className="val">{car.category}</span>
              </div>
              <div className="spec">
                <span className="lbl">Luggage (guide)</span>
                <span className="val">
                  {lug.lg} large · {lug.sm} small
                </span>
              </div>
            </div>

            <div>
              <b style={{ fontSize: 14 }}>What&apos;s included</b>
              <ul style={{ paddingLeft: 18, margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.8 }}>
                <li>Third-Party Liability Insurance</li>
                <li>Free pickup at airport, jetty or hotel</li>
                <li>Unlimited island miles</li>
                <li>24/7 roadside assistance</li>
              </ul>
            </div>

            <div className="price-box">
              <div className="price-dates">
                <div className="price-leg">
                  <span className="price-leg-lbl">Pickup</span>
                  <strong>{fmt(booking.pickDate)}</strong>
                  <em>{booking.pickTime}</em>
                </div>
                <div className="price-leg-mid">
                  <span className="price-leg-days">
                    {n} day{n > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="price-leg">
                  <span className="price-leg-lbl">Return</span>
                  <strong>{fmt(booking.retDate)}</strong>
                  <em>{booking.retTime}</em>
                </div>
              </div>
              <div className="price-loc">
                <MapPin size={11} /> {booking.from}
              </div>
              <div className="price-divider" />
              <div className="row">
                <span>
                  RM {daily} × {n} day{n > 1 ? 's' : ''}
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
              <button
                type="button"
                className="btn btn-leaf btn-lg"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => onBeginCheckout(car)}
              >
                Continue to checkout <ArrowRight size={14} />
              </button>
              <Link to="/cars/$carId" params={{ carId: car.id }} className="btn btn-ghost btn-lg" onClick={onClose}>
                Full details
              </Link>
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 12, marginTop: 4 }}
            >
              <Phone size={13} /> Questions? WhatsApp us — replies usually under 4 min.
            </div>
          </div>
        </div>
      </div>
      {showLuggage && <LuggageFitModal car={car} onClose={() => setShowLuggage(false)} />}
    </>
  )
}
