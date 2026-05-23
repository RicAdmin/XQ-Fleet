import { useCallback, useEffect, useRef, useState } from 'react'

import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import { localePath } from '#/i18n/link'
import { DEFAULT_LOCALE, isLocale } from '#/i18n/locales'
import { getRequestSession } from '#/lib/auth-functions'
import { createPortalBooking, previewBookingPrice } from '#/lib/portal-booking-functions'
import type { PricingPreview } from '#/lib/portal-booking-functions'
import { getPublicCarDetail } from '#/lib/portal-functions'

export const Route = createFileRoute('/$locale/book/$carId')({
  validateSearch: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
  beforeLoad: async ({ params, search }) => {
    const session = await getRequestSession()
    if (!session) {
      const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
      const query = new URLSearchParams()
      if (search.startDate) query.set('startDate', search.startDate)
      if (search.endDate) query.set('endDate', search.endDate)
      const qs = query.toString()
      const returnTo = localePath(
        locale,
        `/book/${params.carId}${qs ? `?${qs}` : ''}`,
      )
      throw redirect({
        to: '/$locale/login',
        params: { locale },
        search: { returnTo },
      })
    }
    return { sessionEmail: session.user.email }
  },
  loader: async ({ params }) => {
    const car = await getPublicCarDetail({ data: { carId: params.carId } })
    if (!car) throw redirect({ to: '/' })
    return { car }
  },
  component: BookingPage,
})

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATIONS = [
  { value: 'Office', label: 'Office (self-pickup, free)' },
  { value: 'Airport', label: 'Langkawi Airport' },
  { value: 'Hotel', label: 'Hotel delivery' },
  { value: 'Jetty', label: 'Kuah Jetty' },
] as const

const PREVIEW_DEBOUNCE_MS = 600

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRM(amountRm: number) {
  return `RM ${amountRm.toFixed(2)}`
}

function formatRMSen(sen: number) {
  return formatRM(sen / 100)
}

function toTimeHms(hhmm: string): string {
  if (!hhmm) return '08:00:00'
  if (/^\d{2}:\d{2}:\d{2}$/.test(hhmm)) return hhmm
  if (/^\d{2}:\d{2}$/.test(hhmm)) return `${hhmm}:00`
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

// ─── Component ────────────────────────────────────────────────────────────────

function BookingPage() {
  const navigate = Route.useNavigate()
  const { carId } = Route.useParams()
  const { sessionEmail } = Route.useRouteContext()
  const { startDate: initStart = '', endDate: initEnd = '' } = Route.useSearch()
  const { car } = Route.useLoaderData()

  const today = new Date().toISOString().split('T')[0]

  // Dates & times
  const [startDate, setStartDate] = useState(initStart || today)
  const [endDate, setEndDate] = useState(initEnd || '')
  const [pickUpTime, setPickUpTime] = useState('08:00')
  const [returnTime, setReturnTime] = useState('08:00')

  // Locations
  const [pickUpLocation, setPickUpLocation] = useState<string>('Office')
  const [returnLocation, setReturnLocation] = useState<string>('Office')

  // Add-ons
  const [childSeat, setChildSeat] = useState(false)
  const [secondDriver, setSecondDriver] = useState(false)

  // Coupon
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState('')

  // Customer details
  const [fullName, setFullName] = useState('')
  const [icOrPassport, setIcOrPassport] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // UI state
  const [preview, setPreview] = useState<PricingPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Live pricing preview ──────────────────────────────────────────────────

  const fetchPreview = useCallback(async () => {
    if (!startDate || !endDate) {
      setPreview(null)
      return
    }
    const s = new Date(startDate)
    const e = new Date(endDate)
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) {
      setPreview(null)
      return
    }

    setIsLoadingPreview(true)
    setPreviewError(null)
    try {
      const result = await previewBookingPrice({
        data: {
          carId,
          startDate,
          endDate,
          pickUpTime: toTimeHms(pickUpTime),
          returnTime: toTimeHms(returnTime),
          pickUpLocation,
          returnLocation,
          childSeat,
          secondDriver,
          couponCode: appliedCoupon || null,
        },
      })
      if ('error' in result) {
        setPreviewError(result.error)
        setPreview(null)
      } else {
        setPreview(result)
        setPreviewError(null)
      }
    } catch {
      setPreviewError('Could not calculate price. Please check your dates.')
      setPreview(null)
    } finally {
      setIsLoadingPreview(false)
    }
  }, [startDate, endDate, pickUpTime, returnTime, pickUpLocation, returnLocation, childSeat, secondDriver, appliedCoupon, carId])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void fetchPreview(), PREVIEW_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchPreview])

  // ── Coupon apply ─────────────────────────────────────────────────────────

  function handleApplyCoupon() {
    setAppliedCoupon(couponInput.trim().toUpperCase())
  }

  function handleCouponKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyCoupon()
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon('')
    setCouponInput('')
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!preview || previewError) {
      setError('Please select valid pickup and return dates.')
      return
    }
    setIsSubmitting(true)
    try {
      const { rentalId } = await createPortalBooking({
        data: {
          carId,
          startDate,
          endDate,
          pickUpTime: toTimeHms(pickUpTime),
          returnTime: toTimeHms(returnTime),
          pickUpLocation,
          returnLocation,
          childSeat,
          secondDriver,
          couponCode: appliedCoupon || null,
          fullName,
          icOrPassport,
          phone,
          email: sessionEmail,
          address,
        },
      })
      await navigate({
        to: '/account/bookings/$rentalId',
        params: { rentalId },
        search: { confirmed: true },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasDates = !!(startDate && endDate && preview)

  return (
    <PublicMarketingShell screenLabel="Book car" mainClassName="container booking-page-main">
      <div className="booking-page">
        {/* Header */}
        <div className="booking-header">
          <p className="booking-eyebrow">Book your car</p>
          <h1 className="booking-title">
            {car.year} {car.make} {car.model}
          </h1>
          <p className="booking-rate">{formatRMSen(car.priceLowSeasonSen)} / day from</p>
        </div>

        <div className="booking-layout">
          {/* ── Form ─────────────────────────────────────────────────── */}
          <form className="booking-form" onSubmit={handleSubmit}>

            {/* Dates & Times */}
            <section className="booking-section">
              <h2 className="booking-section-title">Rental period</h2>
              <div className="booking-date-row">
                <div>
                  <label className="field-label" htmlFor="book-start">Pickup date</label>
                  <input
                    id="book-start"
                    type="date"
                    className="field-input"
                    min={today}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-end">Return date</label>
                  <input
                    id="book-end"
                    type="date"
                    className="field-input"
                    min={startDate || today}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="booking-date-row" style={{ marginTop: '0.75rem' }}>
                <div>
                  <label className="field-label" htmlFor="book-pickup-time">Pickup time</label>
                  <input
                    id="book-pickup-time"
                    type="time"
                    className="field-input"
                    value={pickUpTime}
                    onChange={(e) => setPickUpTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-return-time">Return time</label>
                  <input
                    id="book-return-time"
                    type="time"
                    className="field-input"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Locations */}
            <section className="booking-section">
              <h2 className="booking-section-title">Pickup &amp; return location</h2>
              <div className="booking-date-row">
                <div>
                  <label className="field-label" htmlFor="book-pickup-loc">Pickup location</label>
                  <select
                    id="book-pickup-loc"
                    className="field-input"
                    value={pickUpLocation}
                    onChange={(e) => setPickUpLocation(e.target.value)}
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="book-return-loc">Return location</label>
                  <select
                    id="book-return-loc"
                    className="field-input"
                    value={returnLocation}
                    onChange={(e) => setReturnLocation(e.target.value)}
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Add-ons */}
            <section className="booking-section">
              <h2 className="booking-section-title">Add-ons</h2>
              <div className="booking-addons">
                <label className="booking-addon-item">
                  <input
                    type="checkbox"
                    className="booking-addon-checkbox"
                    checked={childSeat}
                    onChange={(e) => setChildSeat(e.target.checked)}
                  />
                  <span className="booking-addon-label">
                    Child seat <span className="booking-addon-price">+RM 30</span>
                  </span>
                </label>
                <label className="booking-addon-item">
                  <input
                    type="checkbox"
                    className="booking-addon-checkbox"
                    checked={secondDriver}
                    onChange={(e) => setSecondDriver(e.target.checked)}
                  />
                  <span className="booking-addon-label">
                    Additional driver <span className="booking-addon-price">+RM 20</span>
                  </span>
                </label>
              </div>
            </section>

            {/* Your details */}
            <section className="booking-section">
              <h2 className="booking-section-title">Your details</h2>
              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="book-name">Full name (as per IC / passport)</label>
                  <input
                    id="book-name"
                    type="text"
                    autoComplete="name"
                    className="field-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-ic">IC or passport number</label>
                  <input
                    id="book-ic"
                    type="text"
                    className="field-input"
                    value={icOrPassport}
                    onChange={(e) => setIcOrPassport(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-phone">Phone number</label>
                  <input
                    id="book-phone"
                    type="tel"
                    autoComplete="tel"
                    className="field-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="book-address">
                    Address{' '}
                    <span className="text-[var(--sea-ink-soft)] font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="book-address"
                    className="field-input resize-none"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Promo code */}
            <section className="booking-section">
              <h2 className="booking-section-title">Promo code</h2>
              {appliedCoupon ? (
                <div className="booking-coupon-applied">
                  <span className="booking-coupon-tag">{appliedCoupon}</span>
                  {preview?.couponError === 'not-found' && (
                    <span className="booking-coupon-error">Code not found</span>
                  )}
                  {preview?.couponError === 'expired' && (
                    <span className="booking-coupon-error">Code expired</span>
                  )}
                  {!preview?.couponError && preview && preview.discountPercent > 0 && (
                    <span className="booking-coupon-success">
                      −{preview.discountPercent}% applied
                    </span>
                  )}
                  <button
                    type="button"
                    className="booking-coupon-remove"
                    onClick={handleRemoveCoupon}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="booking-coupon-row" role="group" aria-label="Promo code">
                  <input
                    type="text"
                    className="field-input booking-coupon-input"
                    placeholder="Enter promo code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={handleCouponKeyDown}
                    autoCapitalize="characters"
                  />
                  <button
                    type="button"
                    className="button-secondary booking-coupon-btn"
                    disabled={!couponInput.trim()}
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </button>
                </div>
              )}
            </section>

            {error ? <p className="form-error">{error}</p> : null}

            <button
              type="submit"
              className="button-primary w-full justify-center"
              disabled={isSubmitting || !hasDates || !!previewError}
            >
              {isSubmitting ? 'Confirming booking…' : 'Confirm booking'}
            </button>
          </form>

          {/* ── Summary card ─────────────────────────────────────────── */}
          <aside className="booking-summary-card">
            {car.photos[0] ? (
              <img
                src={car.photos[0].url}
                alt={`${car.make} ${car.model}`}
                className="booking-summary-photo"
              />
            ) : (
              <div className="booking-summary-photo-placeholder" />
            )}
            <div className="booking-summary-body">
              <p className="booking-summary-car">
                {car.year} {car.make} {car.model}
              </p>
              <p className="booking-summary-category">{car.category}</p>

              {isLoadingPreview ? (
                <p className="booking-summary-hint">Calculating…</p>
              ) : previewError ? (
                <p className="booking-summary-hint booking-summary-hint--error">{previewError}</p>
              ) : preview ? (
                <div className="booking-summary-breakdown">
                  <div className="booking-summary-row">
                    <span>Base rental ({preview.days} day{preview.days !== 1 ? 's' : ''})</span>
                    <span>{formatRM(preview.baseRental)}</span>
                  </div>
                  {preview.extraCharge > 0 && (
                    <div className="booking-summary-row">
                      <span>
                        {preview.extraRule === 'full-day-cap'
                          ? `Late return (extra day)`
                          : `Extra hours (${preview.extraHours.toFixed(1)}h)`}
                      </span>
                      <span>{formatRM(preview.extraCharge)}</span>
                    </div>
                  )}
                  {preview.addonsTotal > 0 && (
                    <div className="booking-summary-row">
                      <span>Add-ons</span>
                      <span>{formatRM(preview.addonsTotal)}</span>
                    </div>
                  )}
                  {preview.deliveryFee > 0 && (
                    <div className="booking-summary-row">
                      <span>Delivery</span>
                      <span>{formatRM(preview.deliveryFee)}</span>
                    </div>
                  )}
                  {preview.discountAmount > 0 && (
                    <div className="booking-summary-row booking-summary-row--discount">
                      <span>Discount ({preview.discountPercent}%)</span>
                      <span>−{formatRM(preview.discountAmount)}</span>
                    </div>
                  )}
                  <div className="booking-summary-total-row">
                    <span>Total</span>
                    <span>{formatRM(preview.finalTotal)}</span>
                  </div>
                </div>
              ) : (
                <p className="booking-summary-hint">Select dates to see total</p>
              )}

              {car.notes ? <p className="booking-summary-notes">{car.notes}</p> : null}
            </div>
          </aside>
        </div>
      </div>
    </PublicMarketingShell>
  )
}
