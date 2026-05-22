import { useMemo, useState } from 'react'
import { Accessibility, ArrowRight, Check, CirclePlay, Luggage, MapPin, Shield, X } from 'lucide-react'

import { LuggageFitModal } from '#/components/LuggageFitModal'
import { OkuFeatureModal } from '#/components/OkuFeatureModal'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import type { Locale } from '#/i18n/locales'
import { addCalendarDays, formatTripDuration, isAllowedPickupDate, isAllowedReturnDate } from '#/lib/booking-datetime'
import { getCategoryAlternatives } from '#/lib/detail-car-alternatives'
import { isHondaNBox } from '#/lib/fleet-oku'
import { fleetFuelType, heuristicLuggageFit } from '#/lib/fleet-luggage-fit'
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

/** Pickup/return dates and times chosen; pickup must be tomorrow or later. */
export function hasTripDates(
  booking: Pick<BookingState, 'pickDate' | 'retDate' | 'pickTime' | 'retTime'>,
): boolean {
  return (
    isAllowedReturnDate(booking.pickDate, booking.retDate) &&
    Boolean(booking.pickTime.trim()) &&
    Boolean(booking.retTime.trim())
  )
}

export function sanitizeBookingDates(booking: BookingState): BookingState {
  const b = cloneBooking(booking)
  if (!isAllowedPickupDate(b.pickDate)) {
    b.pickDate = null
    b.retDate = null
    b.pickTime = ''
    b.retTime = ''
    return b
  }
  if (!isAllowedReturnDate(b.pickDate, b.retDate)) {
    b.retDate = null
    b.retTime = ''
  }
  return b
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
    pickTime: '',
    retTime: '',
    adults: 2,
    children: 0,
  }
}

export function nightsBetween(a: Date | null, b: Date | null) {
  if (!a || !b) return 0
  const ms = b.getTime() - a.getTime()
  return ms > 0 ? Math.max(1, Math.round(ms / 86_400_000)) : 0
}

export function cloneBooking(booking: BookingState): BookingState {
  return {
    ...booking,
    pickDate: booking.pickDate ? new Date(booking.pickDate.getTime()) : null,
    retDate: booking.retDate ? new Date(booking.retDate.getTime()) : null,
  }
}

/** Pickup / return line for price box and results — matches active search criteria. */
export function bookingLocationSummary(booking: BookingState, pickupTbc: string): string {
  const pickup = booking.from.trim() || pickupTbc
  if (booking.tripType === 'round') {
    return pickup
  }
  const ret = booking.retLoc.trim()
  if (ret && ret !== pickup) {
    return `${pickup} → ${ret}`
  }
  return pickup
}

function estimateTripTotal(dailyRateSen: number, tripDays: number) {
  const daily = Math.round(dailyRateSen / 100)
  const subtotal = daily * tripDays
  const discount = Math.round(subtotal * 0.15)
  return subtotal - discount
}

export function CarDetailDialog({
  car,
  fleet,
  booking,
  nights,
  checkoutReady = true,
  onClose,
  onBeginCheckout,
  onSelectCar,
}: {
  car: PublicCarRow
  fleet: PublicCarRow[]
  booking: BookingState
  nights: number
  checkoutReady?: boolean
  onClose: () => void
  onBeginCheckout: (car: PublicCarRow) => void
  onSelectCar: (car: PublicCarRow) => void
}) {
  const { t, locale } = usePublicI18n()
  const [showLuggage, setShowLuggage] = useState(false)
  const [showOku, setShowOku] = useState(false)
  const isOkuNBox = isHondaNBox(car)
  const n = nights || 1
  const daily = Math.round(car.dailyRateSen / 100)
  const subtotal = daily * n
  const discount = Math.round(subtotal * 0.15)
  const total = subtotal - discount
  const dateLocale: Record<Locale, string> = { en: 'en-GB', ms: 'ms-MY', zh: 'zh-CN' }
  const fmt = (d: Date | null) =>
    d
      ? d.toLocaleDateString(dateLocale[locale], { weekday: 'short', day: '2-digit', month: 'short' })
      : '—'
  const lug = heuristicLuggageFit(car.category)
  const fuelType = fleetFuelType(car)
  const pickupTbc = t('carDetail.pickupTbc')
  const pickupLoc = booking.from.trim() || pickupTbc
  const returnLoc =
    booking.tripType === 'round' ? pickupLoc : booking.retLoc.trim() || pickupLoc
  const tripDuration = formatTripDuration(
    booking.pickDate,
    booking.pickTime,
    booking.retDate,
    booking.retTime,
  )
  const alternatives = useMemo(() => getCategoryAlternatives(car, fleet), [car, fleet])
  const categoryLabel =
    car.category === 'other' ? t('carDetail.thisClass') : car.category
  const okuFeatures = useMemo(
    () => [
      t('carDetail.okuFeature1'),
      t('carDetail.okuFeature2'),
      t('carDetail.okuFeature3'),
      t('carDetail.okuFeature4'),
    ],
    [t],
  )

  const alternativesBlock = (placement: 'gallery' | 'tail') =>
    alternatives.length > 0 ? (
      <div className={`detail-alternatives detail-alternatives--${placement}`}>
        <p className="detail-alternatives-title">
          {t('carDetail.alsoConsiderIn', { category: categoryLabel })}
        </p>
        <ul className="detail-alternatives-list">
          {alternatives.map(({ car: alt }) => {
            const altDaily = Math.round(alt.dailyRateSen / 100)
            const altTrip = estimateTripTotal(alt.dailyRateSen, n)
            return (
              <li key={alt.id}>
                <button
                  type="button"
                  className="detail-alt-card"
                  onClick={() => onSelectCar(alt)}
                >
                  <span className="detail-alt-thumb">
                    {alt.coverPhotoUrl ? (
                      <img src={alt.coverPhotoUrl} alt="" />
                    ) : (
                      <span className="detail-alt-thumb-empty">{t('carDetail.noPhoto')}</span>
                    )}
                  </span>
                  <span className="detail-alt-body">
                    <span className="detail-alt-name">
                      {alt.make} {alt.model}
                    </span>
                    <span className="detail-alt-price">
                      <span className="detail-alt-price-row">
                        <span className="detail-alt-price-main">RM {altDaily}</span>
                        <span className="detail-alt-price-per">{t('carDetail.perDay')}</span>
                      </span>
                      <span className="detail-alt-price-trip">
                        <span className="detail-alt-price-est">
                          {t('carDetail.estRm', { amount: altTrip })}
                        </span>
                        <span className="detail-alt-price-days">
                          {n > 1
                            ? t('carDetail.forDays', { count: n })
                            : t('carDetail.forDay')}
                        </span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    ) : null

  return (
    <>
      <div className="results-overlay" role="presentation" onClick={onClose}>
        <div
          className="detail-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={t('carDetail.vehicleDetails')}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="close-btn" aria-label={t('common.close')} onClick={onClose}>
            <X size={16} />
          </button>

          <div className="detail-dialog-inner">
            <section className="detail-dialog-gallery" aria-label={t('carDetail.vehiclePhoto')}>
            <div className="detail-hero-meta">
              <div className="detail-hero-pills">
                <span className="detail-category-pill">{car.category}</span>
                {isOkuNBox ? (
                  <span className="detail-category-pill detail-category-pill--oku">
                    {t('carDetail.okuFriendly')}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm detail-hero-luggage-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowLuggage(true)
                }}
              >
                <Luggage size={14} /> {t('carDetail.luggageFitGuide')}
              </button>
            </div>
            <div className="detail-hero">
              {car.coverPhotoUrl ? (
                <img src={car.coverPhotoUrl} alt={`${car.make} ${car.model}`} />
              ) : (
                <div className="detail-hero-empty">{t('carDetail.noPhoto')}</div>
              )}
            </div>
            <div className="detail-trust-badges">
              <span>
                <Shield size={12} aria-hidden /> {t('carDetail.insuranceIncluded')}
              </span>
              <span>
                <Check size={12} aria-hidden /> {t('carDetail.cancelFree48h')}
              </span>
            </div>
            {alternativesBlock('gallery')}
            </section>

            <section className="detail-dialog-details">
            <div className="detail-dialog-head">
              <span className="eyebrow">{car.category}</span>
              <h2 className="detail-dialog-title">
                {car.make} {car.model}
              </h2>
            </div>

            <div className="detail-spec-grid" aria-label={t('carDetail.vehicleHighlights')}>
              <div className="detail-spec">
                <span className="detail-spec-label">{t('carDetail.passengers')}</span>
                <span className="detail-spec-value">{lug.seats}</span>
              </div>
              <div className="detail-spec">
                <span className="detail-spec-label">{t('carDetail.fuel')}</span>
                <span className="detail-spec-value">{fuelType}</span>
              </div>
              <div className="detail-spec">
                <span className="detail-spec-label">{t('carDetail.luggage')}</span>
                <span
                  className="detail-spec-value"
                  title={`${lug.lg} large · ${lug.sm} small`}
                >
                  {lug.lg}L · {lug.sm}S
                </span>
              </div>
            </div>

            {isOkuNBox ? (
              <div className="detail-oku-card">
                <div className="detail-oku-head">
                  <div className="detail-oku-title">
                    <span className="detail-oku-icon" aria-hidden>
                      <Accessibility size={18} />
                    </span>
                    <strong>{t('carDetail.okuHeadline')}</strong>
                  </div>
                  <button
                    type="button"
                    className="detail-oku-video-btn"
                    onClick={() => setShowOku(true)}
                    aria-label={t('carDetail.watchOkuAria')}
                  >
                    <CirclePlay size={18} strokeWidth={1.75} aria-hidden />
                    <span>{t('carDetail.watchGuide')}</span>
                  </button>
                </div>
                <p className="detail-oku-summary">{t('carDetail.okuSummary')}</p>
                <ul className="detail-oku-features">
                  {okuFeatures.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="price-box">
              <div className="price-dates">
                <div className="price-leg">
                  <span className="price-leg-lbl">{t('carDetail.pickup')}</span>
                  <strong>{fmt(booking.pickDate)}</strong>
                  <em>{booking.pickTime}</em>
                  <span className="price-leg-loc">
                    <MapPin size={11} aria-hidden />
                    <span>{pickupLoc}</span>
                  </span>
                </div>
                <div className="price-leg-mid">
                  <span className="price-leg-days" title={t('carDetail.rentalDuration', { duration: tripDuration })}>
                    {tripDuration}
                  </span>
                </div>
                <div className="price-leg">
                  <span className="price-leg-lbl">{t('carDetail.return')}</span>
                  <strong>{fmt(booking.retDate)}</strong>
                  <em>{booking.retTime}</em>
                  <span className="price-leg-loc">
                    <MapPin size={11} aria-hidden />
                    <span>{returnLoc}</span>
                  </span>
                </div>
              </div>
              <div className="price-divider" />
              <div className="row">
                <span>{t('carDetail.dayMultiply', { daily, count: n })}</span>
                <span className="v">RM {subtotal}</span>
              </div>
              <div className="row">
                <span>{t('carDetail.earlyBirdDiscount')}</span>
                <span className="v" style={{ color: 'var(--brand-coral)' }}>
                  −RM {discount}
                </span>
              </div>
              <div className="row total">
                <span>{t('carDetail.totalEstimate')}</span>
                <span>RM {total}</span>
              </div>
            </div>

            <div className="detail-dialog-footer">
              <button
                type="button"
                className="btn btn-leaf btn-lg detail-checkout-btn"
                disabled={!checkoutReady}
                title={checkoutReady ? undefined : t('carDetail.searchAgainTooltip')}
                onClick={() => onBeginCheckout(car)}
              >
                {t('carDetail.continueToCheckout')} <ArrowRight size={14} />
              </button>
            </div>
            {alternativesBlock('tail')}
            </section>
          </div>
        </div>
      </div>
      {showLuggage && <LuggageFitModal car={car} onClose={() => setShowLuggage(false)} />}
      {showOku && isOkuNBox && <OkuFeatureModal car={car} onClose={() => setShowOku(false)} />}
    </>
  )
}
