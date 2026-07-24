import { useMemo, useState } from 'react'
import { Accessibility, ArrowRight, Check, CirclePlay, Luggage, MapPin, Shield, X } from 'lucide-react'

import { LuggageFitModal } from '#/components/LuggageFitModal'
import { OkuFeatureModal } from '#/components/OkuFeatureModal'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import type { Locale } from '#/i18n/locales'
import { addCalendarDays, formatTripDuration, isAllowedPickupDate, isAllowedReturnDate } from '#/lib/booking-datetime'
import {
  type BookingState,
  bookingLocationSummary,
  cloneBooking,
  hasTripDates,
} from '#/lib/booking-state'
import { displayDailyRateSen, tripBaseRentalSen } from '#/lib/car-display-price'
import { getCategoryAlternatives } from '#/lib/detail-car-alternatives'
import { isHondaNBox } from '#/lib/fleet-oku'
import { catalogFitInput } from '#/lib/car-catalog'
import { carLuggageFit, fleetFuelType } from '#/lib/fleet-luggage-fit'
import type { PublicCarRow } from '#/lib/portal-functions'
import type { SeasonRange } from '#/lib/pricing-logic'

export type { BookingState, TripType } from '#/lib/booking-state'
export {
  bookingLocationSummary,
  cloneBooking,
  defaultBooking,
  hasTripDates,
  nightsBetween,
  sanitizeBookingDates,
} from '#/lib/booking-state'

/** Set true to show the 15% early-bird line in the detail price box. Logic stays either way. */
const SHOW_EARLY_BIRD_DISCOUNT = false

function earlyBirdTotal(subtotalRm: number) {
  return subtotalRm - Math.round(subtotalRm * 0.15)
}

export function CarDetailDialog({
  car,
  fleet,
  booking,
  nights,
  checkoutReady = true,
  seasonCalendar = [],
  onClose,
  onBeginCheckout,
  onSelectCar,
}: {
  car: PublicCarRow
  fleet: PublicCarRow[]
  booking: BookingState
  nights: number
  checkoutReady?: boolean
  seasonCalendar?: SeasonRange[]
  onClose: () => void
  onBeginCheckout: (car: PublicCarRow) => void
  onSelectCar: (car: PublicCarRow) => void
}) {
  const { t, locale } = usePublicI18n()
  const [showLuggage, setShowLuggage] = useState(false)
  const [showOku, setShowOku] = useState(false)
  const isOkuNBox = isHondaNBox(car)
  const n = nights || 1
  const tripDatesSelected = hasTripDates(booking)
  const dailySen = displayDailyRateSen(
    car,
    tripDatesSelected ? booking.pickDate : null,
    tripDatesSelected ? booking.retDate : null,
    seasonCalendar,
  )
  const daily = Math.round(dailySen / 100)
  const subtotal =
    tripDatesSelected && booking.pickDate && booking.retDate && seasonCalendar.length > 0
      ? Math.round(tripBaseRentalSen(car, booking.pickDate, booking.retDate, seasonCalendar) / 100)
      : daily * n
  const discount = Math.round(subtotal * 0.15)
  const total = subtotal - discount
  const displayTotal = SHOW_EARLY_BIRD_DISCOUNT ? total : subtotal
  const dateLocale: Record<Locale, string> = { en: 'en-GB', ms: 'ms-MY', zh: 'zh-CN' }
  const fmt = (d: Date | null) =>
    d
      ? d.toLocaleDateString(dateLocale[locale], { weekday: 'short', day: '2-digit', month: 'short' })
      : '—'
  const lug = carLuggageFit(catalogFitInput(car))
  const fuelType = fleetFuelType({ ...catalogFitInput(car), make: car.make, model: car.model, notes: car.notes })
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
            const altDailySen = displayDailyRateSen(
              alt,
              tripDatesSelected ? booking.pickDate : null,
              tripDatesSelected ? booking.retDate : null,
              seasonCalendar,
            )
            const altDaily = Math.round(altDailySen / 100)
            const altSubtotal =
              tripDatesSelected && booking.pickDate && booking.retDate && seasonCalendar.length > 0
                ? Math.round(
                    tripBaseRentalSen(alt, booking.pickDate, booking.retDate, seasonCalendar) / 100,
                  )
                : Math.round(altDailySen / 100) * n
            const altTrip = SHOW_EARLY_BIRD_DISCOUNT
              ? earlyBirdTotal(altSubtotal)
              : altSubtotal
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
              {SHOW_EARLY_BIRD_DISCOUNT ? (
                <div className="row">
                  <span>{t('carDetail.earlyBirdDiscount')}</span>
                  <span className="v" style={{ color: 'var(--brand-coral)' }}>
                    −RM {discount}
                  </span>
                </div>
              ) : null}
              <div className="row total">
                <span>{t('carDetail.totalEstimate')}</span>
                <span>RM {displayTotal}</span>
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
