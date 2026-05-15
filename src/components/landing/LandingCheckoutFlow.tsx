import { useCallback, useEffect, useMemo, useState } from 'react'

import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Cog,
  Globe,
  Key,
  Phone,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { createPortalBooking } from '#/lib/portal-booking-functions'
import { heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'

function toPricingLocation(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('airport')) return 'Airport'
  if (l.includes('jetty') || l.includes('ferry')) return 'Jetty'
  if (l.includes('hotel')) return 'Hotel'
  return 'Office'
}

function toTimeHms(hhmm: string): string {
  if (!hhmm) return '08:00:00'
  // Already HH:MM:SS
  if (/^\d{2}:\d{2}:\d{2}$/.test(hhmm)) return hhmm
  // 24-hour HH:MM
  if (/^\d{2}:\d{2}$/.test(hhmm)) return `${hhmm}:00`
  // 12-hour with AM/PM e.g. "10:30 AM", "4:30 PM"
  const m = hhmm.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2]
    const period = m[3].toUpperCase()
    if (period === 'PM' && h !== 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${min}:00`
  }
  return '08:00:00'
}

export type BookingState = {
  from: string
  retLoc: string
  tripType: 'round' | 'oneway'
  pickDate: Date | null
  retDate: Date | null
  pickTime: string
  retTime: string
  adults: number
  children: number
}

type SessionUserLite = { name?: string | null; email: string }

type AddonKey = 'full' | 'child' | 'gps' | 'second'

type PayMethod = 'card' | 'fpx' | 'grab' | 'later'

const ADDONS: Array<{
  key: AddonKey
  title: string
  desc: string
  price: number
  per: string
  recommended?: boolean
}> = [
  {
    key: 'full',
    title: 'Full collision protection',
    desc: 'Reduce excess to zero. Drive with total peace of mind.',
    price: 25,
    per: '/ day',
    recommended: true,
  },
  {
    key: 'child',
    title: 'Child safety seat',
    desc: 'Suitable for ages 0–4. Installed for you at pickup.',
    price: 30,
    per: 'one time',
  },
  {
    key: 'gps',
    title: 'GPS navigation device',
    desc: 'Pre-loaded with our top 10 island spots and beach routes.',
    price: 12,
    per: '/ day',
  },
  {
    key: 'second',
    title: 'Additional driver',
    desc: 'Add a friend or family member. License required at pickup.',
    price: 20,
    per: '/ day',
  },
]

const PAY_METHODS: Array<{
  id: PayMethod
  title: string
  desc: string
  icon: typeof Wallet
  disabled?: boolean
}> = [
  { id: 'card', title: 'Credit / Debit card', desc: 'Visa, Mastercard, AMEX — via secure gateway', icon: Wallet },
  { id: 'fpx', title: 'Online banking (FPX)', desc: 'Maybank, CIMB, RHB, Public Bank, +14', icon: Globe },
  { id: 'grab', title: 'GrabPay', desc: 'Coming soon', icon: Sparkles, disabled: true },
  { id: 'later', title: 'Pay at pickup', desc: 'Not available for online holds yet', icon: Key, disabled: true },
]

function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return 1
  const ms = b.getTime() - a.getTime()
  return ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 1
}

function fmtShort(d: Date | null) {
  return d
    ? d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })
    : '—'
}

function vehicleTitle(car: PublicCarRow) {
  return `${car.year} ${car.make} ${car.model}`
}

type LandingCheckoutFlowProps = {
  car: PublicCarRow
  booking: BookingState
  startYmd?: string
  endYmd?: string
  user?: SessionUserLite
  backHref: string
  onEditTrip: () => void
}

export function LandingCheckoutFlow({
  car,
  booking,
  startYmd,
  endYmd,
  user,
  backHref,
  onEditTrip,
}: LandingCheckoutFlowProps) {
  const navigate = useNavigate()
  const nights = nightsBetween(booking.pickDate, booking.retDate)
  const daily = Math.round(car.dailyRateSen / 100)
  const subtotal = daily * nights
  const discount = Math.round(subtotal * 0.15)
  const insurance = 18 * nights

  const [step, setStep] = useState(0)
  const [addons, setAddons] = useState<Record<AddonKey, boolean>>({
    full: true,
    child: false,
    gps: false,
    second: false,
  })
  const [details, setDetails] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    license: '',
    country: 'Malaysia',
  })
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [rentalId, setRentalId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [flowError, setFlowError] = useState<string | null>(null)

  useEffect(() => {
    setDetails((d) => ({
      ...d,
      name: user?.name ?? d.name,
      email: user?.email ?? d.email,
    }))
  }, [user?.name, user?.email])

  const addonCost = useMemo(() => {
    let sum = 0
    if (addons.child) sum += 30
    if (addons.gps) sum += 12 * nights
    if (addons.second) sum += 20 * nights
    if (addons.full) sum += 25 * nights
    return sum
  }, [addons, nights])

  const tax = Math.round((subtotal - discount + insurance + addonCost) * 0.06)
  const total = subtotal - discount + insurance + addonCost + tax

  const lug = heuristicLuggageFit(car.category)
  const returnLabel = booking.tripType === 'round' ? `${booking.from} (same)` : booking.retLoc || booking.from

  const validateReview = useCallback(() => {
    const e: Record<string, string> = {}
    if (!details.name.trim()) e.name = 'Required'
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(details.email)) e.email = 'Use a valid email'
    if (!details.phone.trim()) e.phone = 'Required'
    if (!details.license.trim()) e.license = 'Required'
    setErrs(e)
    return Object.keys(e).length === 0
  }, [details])

  const createBooking = useCallback(async () => {
    if (!startYmd || !endYmd) {
      setFlowError('Pick valid dates from the search bar first.')
      return
    }
    setFlowError(null)
    setSubmitting(true)
    try {
      const returnLoc = booking.tripType === 'round' ? booking.from : (booking.retLoc || booking.from)
      const { rentalId: id } = await createPortalBooking({
        data: {
          carId: car.id,
          startDate: startYmd,
          endDate: endYmd,
          pickUpTime: toTimeHms(booking.pickTime),
          returnTime: toTimeHms(booking.retTime),
          pickUpLocation: toPricingLocation(booking.from),
          returnLocation: toPricingLocation(returnLoc),
          childSeat: addons.child,
          secondDriver: addons.second,
          couponCode: null,
          fullName: details.name.trim(),
          icOrPassport: details.license.trim(),
          phone: details.phone.trim(),
          address: details.country ? `Country: ${details.country}` : undefined,
        },
      })
      setRentalId(id)
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (err) {
      setFlowError(err instanceof Error ? err.message : 'Could not create booking.')
    } finally {
      setSubmitting(false)
    }
  }, [car.id, startYmd, endYmd, details, booking, addons])

  const advance = useCallback(async () => {
    setFlowError(null)
    if (step === 0) {
      if (!validateReview()) return
      setStep(1)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    if (step === 1) {
      if (!user) return
      if (payMethod === 'later' || payMethod === 'grab') {
        setFlowError('Choose card or FPX to continue.')
        return
      }
      await createBooking()
      return
    }
    if (step === 2 && rentalId) {
      await navigate({ to: '/pay/$rentalId', params: { rentalId } })
    }
  }, [step, validateReview, user, payMethod, createBooking, rentalId, navigate])

  const bookReturnTo = `/book/${car.id}?startDate=${encodeURIComponent(startYmd ?? '')}&endDate=${encodeURIComponent(endYmd ?? '')}`

  return (
    <div className="checkout">
      <header className="checkout-header">
        <Link to={backHref} className="close-btn" aria-label="Back">
          <ArrowLeft size={16} />
        </Link>
        <div className="checkout-stepbar">
          {(['Review', 'Payment', 'Confirmation'] as const).map((label, i) => (
            <div key={label} className={'checkout-step' + (step === i ? ' on' : step > i ? ' done' : '')}>
              <span className="checkout-step-num">
                {step > i ? <Check size={12} /> : String(i + 1).padStart(2, '0')}
              </span>
              <span>{label}</span>
              {i < 2 ? <span className="checkout-step-line" /> : null}
            </div>
          ))}
        </div>
        <span className="checkout-help">
          <Phone size={12} /> Need help? +60 11 3521 5576
        </span>
        </header>

        <div className="checkout-grid">
          <main className="checkout-main">
            {step === 0 ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">Step 1 of 3</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    Review your rental.
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Confirm the details below — we&apos;ll email your receipt after payment.
                  </p>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Trip details</h3>
                    <button type="button" className="checkout-edit" onClick={onEditTrip}>
                      Edit
                    </button>
                  </div>
                  <div className="trip-grid">
                    <div className="trip-bit">
                      <span className="lbl">Pickup</span>
                      <strong>{booking.from}</strong>
                      <span className="sub">
                        {fmtShort(booking.pickDate)} · {booking.pickTime}
                      </span>
                    </div>
                    <div className="trip-arrow">
                      <ArrowRight size={16} />
                    </div>
                    <div className="trip-bit">
                      <span className="lbl">Return</span>
                      <strong>{returnLabel}</strong>
                      <span className="sub">
                        {fmtShort(booking.retDate)} · {booking.retTime}
                      </span>
                    </div>
                  </div>
                  <div className="trip-note">
                    <Clock size={12} /> {nights} day{nights > 1 ? 's' : ''} rental · free meet-and-greet at pickup
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Add-ons &amp; protection</h3>
                    <span className="checkout-card-meta">Optional · skip any you don&apos;t need</span>
                  </div>
                  <div className="addon-list">
                    {ADDONS.map((a) => (
                      <label key={a.key} className={'addon' + (addons[a.key] ? ' on' : '')}>
                        <input
                          type="checkbox"
                          checked={addons[a.key]}
                          onChange={(e) => setAddons((prev) => ({ ...prev, [a.key]: e.target.checked }))}
                        />
                        <div className="addon-tick">
                          <Check size={12} />
                        </div>
                        <div className="addon-body">
                          <div className="addon-top">
                            <span className="addon-name">
                              {a.title}{' '}
                              {a.recommended ? <span className="addon-rec">Recommended</span> : null}
                            </span>
                            <span className="addon-price">
                              + RM {a.price} <span>{a.per}</span>
                            </span>
                          </div>
                          <p>{a.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Driver details</h3>
                    <span className="checkout-card-meta">As shown on your driver&apos;s license</span>
                  </div>
                  <div className="form-grid">
                    <label className="auth-field">
                      <span>Full name</span>
                      <input
                        value={details.name}
                        onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                        placeholder="John Tan"
                      />
                      {errs.name ? <em>{errs.name}</em> : null}
                    </label>
                    <label className="auth-field">
                      <span>Email</span>
                      <input
                        type="email"
                        value={details.email}
                        onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                        placeholder="john@example.com"
                      />
                      {errs.email ? <em>{errs.email}</em> : null}
                    </label>
                    <label className="auth-field">
                      <span>Mobile number</span>
                      <input
                        value={details.phone}
                        onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="+60 12 345 6789"
                      />
                      {errs.phone ? <em>{errs.phone}</em> : null}
                    </label>
                    <label className="auth-field">
                      <span>IC / Passport / License no.</span>
                      <input
                        value={details.license}
                        onChange={(e) => setDetails((d) => ({ ...d, license: e.target.value }))}
                        placeholder="MyKad / IDP / DL no."
                      />
                      {errs.license ? <em>{errs.license}</em> : null}
                    </label>
                    <label className="auth-field" style={{ gridColumn: '1 / -1' }}>
                      <span>Issuing country</span>
                      <select
                        value={details.country}
                        onChange={(e) => setDetails((d) => ({ ...d, country: e.target.value }))}
                      >
                        {[
                          'Malaysia',
                          'Singapore',
                          'Thailand',
                          'Indonesia',
                          'Philippines',
                          'United States',
                          'United Kingdom',
                          'Australia',
                          'Other',
                        ].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </section>

                <section className="checkout-card cancel-card">
                  <Shield size={20} style={{ color: 'var(--brand-leaf)', flex: '0 0 auto' }} />
                  <div>
                    <strong>Free cancellation until 48 hours before pickup.</strong>
                    <p>
                      Plans change — we get it. Cancel up to 2 days before your pickup time and we&apos;ll refund every
                      ringgit, no questions asked.
                    </p>
                  </div>
                </section>
              </div>
            ) : null}

            {step === 1 && user ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">Step 2 of 3</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    Payment.
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Secure checkout — you&apos;ll finish card or bank payment on the next screen (iPay88).
                  </p>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Choose a payment method</h3>
                    <span className="checkout-card-meta">
                      <Shield size={11} /> Encrypted connection
                    </span>
                  </div>
                  <div className="pay-methods">
                    {PAY_METHODS.map((m) => {
                      const Icon = m.icon
                      return (
                        <label
                          key={m.id}
                          className={'pay-method' + (payMethod === m.id ? ' on' : '')}
                          style={
                            m.disabled
                              ? { cursor: 'not-allowed', opacity: 0.55, pointerEvents: 'none' as const }
                              : undefined
                          }
                        >
                          <input
                            type="radio"
                            name="method"
                            disabled={m.disabled}
                            checked={payMethod === m.id}
                            onChange={() => {
                              if (!m.disabled) setPayMethod(m.id)
                            }}
                          />
                          <span className="pay-method-radio" />
                          <span className="pay-method-icon">
                            <Icon size={16} />
                          </span>
                          <span className="pay-method-body">
                            <strong>{m.title}</strong>
                            <span>{m.desc}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </section>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>What happens next</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    We&apos;ll create your booking and take you to our payment page. Your car is held for a short window
                    while you complete payment.
                  </p>
                </section>

                {flowError ? (
                  <p style={{ color: 'var(--brand-coral)', margin: 0, fontSize: 14 }}>{flowError}</p>
                ) : null}
              </div>
            ) : null}

            {step === 1 && !user ? (
              <div className="checkout-section">
                <div className="checkout-progress-meta">
                  <span className="eyebrow">Step 2 of 3</span>
                  <h2 className="h-section" style={{ marginTop: 4 }}>
                    Sign in to continue.
                  </h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    We need your account to hold the car and send your booking confirmation.
                  </p>
                </div>
                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Customer account</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', margin: '0 0 16px', fontSize: 14, lineHeight: 1.6 }}>
                    Use the same email you entered in the previous step after you sign in, or update it on the booking
                    form.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    <Link to="/login" search={{ returnTo: bookReturnTo }} className="btn btn-leaf btn-lg">
                      Log in
                    </Link>
                    <Link to="/register" search={{ returnTo: bookReturnTo }} className="btn btn-ghost btn-lg">
                      Create account
                    </Link>
                  </div>
                  <p style={{ margin: '18px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                    Or continue on the standard booking page (same dates we passed in the link).
                  </p>
                  <Link to="/book/$carId" params={{ carId: car.id }} search={{ startDate: startYmd, endDate: endYmd }} className="checkout-edit">
                    Open booking form →
                  </Link>
                </section>
              </div>
            ) : null}

            {step === 2 && rentalId ? (
              <div className="checkout-section">
                <div className="confirmation-hero">
                  <div className="confirmation-tick">
                    <Check size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-leaf)' }}>
                    Step 3 of 3 · Booking created
                  </span>
                  <h2 className="h-section">You&apos;re almost there.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    We&apos;ve saved your trip for <b style={{ color: 'var(--ink)' }}>{details.email}</b>. Complete
                    payment now to confirm — show your booking reference at pickup.
                  </p>
                  <div className="confirmation-id">
                    <span>Booking ref</span>
                    <strong>{rentalId.slice(0, 8).toUpperCase()}</strong>
                  </div>
                </div>

                <section className="checkout-card">
                  <div className="checkout-card-head">
                    <h3>Secure payment</h3>
                  </div>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
                    You&apos;ll pay <b>RM {total}</b> (or your deposit, if applicable) on the next screen via iPay88.
                  </p>
                </section>
              </div>
            ) : null}
          </main>

          <aside className="checkout-summary">
            <div className="cs-car">
              {car.coverPhotoUrl ? (
                <img src={car.coverPhotoUrl} alt="" />
              ) : (
                <div style={{ width: 96, height: 60, background: 'var(--canvas-2)', borderRadius: 10 }} />
              )}
              <div>
                <div className="cs-car-name">{vehicleTitle(car)}</div>
                <div className="cs-car-meta">
                  <Cog size={11} /> {car.category} · <span>{lug.seats} seats</span>
                </div>
              </div>
            </div>

            <div className="cs-dates">
              <div>
                <span>Pickup</span>
                <strong>
                  {booking.pickDate?.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                </strong>
                <em>{booking.pickTime}</em>
              </div>
              <div className="cs-dates-mid">
                <span className="cs-dates-days">
                  {nights} day{nights > 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <span>Return</span>
                <strong>
                  {booking.retDate?.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                </strong>
                <em>{booking.retTime}</em>
              </div>
            </div>

            <div className="cs-divider" />
            <div className="cs-rows">
              <div className="cs-row">
                <span>
                  Daily rate × {nights}
                </span>
                <span>RM {subtotal}</span>
              </div>
              <div className="cs-row">
                <span>Early-bird discount</span>
                <span style={{ color: 'var(--brand-coral)' }}>−RM {discount}</span>
              </div>
              <div className="cs-row">
                <span>Insurance</span>
                <span>RM {insurance}</span>
              </div>
              {addonCost > 0 ? (
                <div className="cs-row">
                  <span>Add-ons</span>
                  <span>RM {addonCost}</span>
                </div>
              ) : null}
              <div className="cs-row">
                <span>Service tax (6%)</span>
                <span>RM {tax}</span>
              </div>
            </div>
            <div className="cs-divider" />
            <div className="cs-total">
              <span>Total to pay</span>
              <span>RM {total}</span>
            </div>
            <div className="cs-trust">
              <span>
                <Shield size={11} /> Insurance &amp; 48-h cancellation included
              </span>
              <span>
                <Check size={11} /> No charge until you complete payment
              </span>
            </div>

            {step < 2 ? (
              step === 1 && !user ? (
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep(0)}>
                  Back to review
                </button>
              ) : (
                <button type="button" className="btn btn-leaf btn-lg" onClick={() => void advance()} disabled={submitting}>
                  {step === 0
                    ? 'Continue to payment'
                    : submitting
                      ? 'Creating booking…'
                      : 'Create booking & continue'}
                  <ArrowRight size={14} />
                </button>
              )
            ) : (
              <button type="button" className="btn btn-leaf btn-lg" onClick={() => void advance()} disabled={!rentalId}>
                Pay RM {total} <ArrowRight size={14} />
              </button>
            )}
          </aside>
        </div>
    </div>
  )
}
