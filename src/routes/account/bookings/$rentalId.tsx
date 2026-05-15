import { useState } from 'react'

import { Link, createFileRoute, getRouteApi, redirect, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  Check,
  Copy,
  MapPin,
  Phone,
  Shield,
  Wallet,
  XCircle,
} from 'lucide-react'
import { z } from 'zod'

import CustomerAccountChrome from '#/components/portal/CustomerAccountChrome'
import type { CustomerFacingStatus } from '#/lib/portal-booking-functions'
import { getBookingDetail } from '#/lib/portal-booking-functions'

const accountRouteApi = getRouteApi('/account')

export const Route = createFileRoute('/account/bookings/$rentalId')({
  validateSearch: z.object({
    confirmed: z.boolean().optional(),
    payment: z.enum(['response', 'error']).optional(),
  }),
  loader: async ({ params }) => {
    const booking = await getBookingDetail({ data: { rentalId: params.rentalId } })
    if (!booking) throw redirect({ to: '/account/rentals' })
    return { booking }
  },
  component: BookingDetailPage,
})

function formatRM(amountSen: number) {
  return `RM ${(amountSen / 100).toFixed(2)}`
}

function formatDateLong(date: Date) {
  return new Date(date).toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateShort(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function toYmd(d: Date) {
  return new Date(d).toISOString().slice(0, 10)
}

function statusLabel(status: CustomerFacingStatus) {
  switch (status) {
    case 'Pending Payment':
      return 'Pending payment'
    case 'Confirmed':
      return 'Confirmed'
    case 'Active':
      return 'Active'
    case 'Completed':
      return 'Completed'
    case 'Cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

function statusPillClass(status: CustomerFacingStatus) {
  switch (status) {
    case 'Pending Payment':
      return 'cxq-rental-status cxq-rental-status--pending'
    case 'Confirmed':
      return 'cxq-rental-status cxq-rental-status--confirmed'
    case 'Active':
      return 'cxq-rental-status cxq-rental-status--active'
    case 'Completed':
      return 'cxq-rental-status cxq-rental-status--completed'
    case 'Cancelled':
      return 'cxq-rental-status cxq-rental-status--cancelled'
    default:
      return 'cxq-rental-status'
  }
}

function BookingDetailPage() {
  const { session } = Route.useRouteContext()
  const { bookings, portalCustomer } = accountRouteApi.useLoaderData()
  const { booking } = Route.useLoaderData()
  const { confirmed, payment } = Route.useSearch()
  const navigate = useNavigate()

  const displayPhone = portalCustomer?.phone ?? ''

  const days = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86_400_000,
  )

  function handlePayNow() {
    navigate({ to: '/pay/$rentalId', params: { rentalId: booking.id } })
  }

  const showPaymentFail =
    payment === 'error' || (payment === 'response' && booking.customerStatus === 'Pending Payment')
  const showPaymentSuccess = payment === 'response' && booking.customerStatus === 'Confirmed'

  const startYmd = toYmd(new Date(booking.startDate))
  const endYmd = toYmd(new Date(booking.endDate))

  return (
    <CustomerAccountChrome
      session={session}
      bookingsCount={bookings.length}
      displayPhone={displayPhone}
    >
      <main className="cxq-profile-body">
        <div className="cxq-booking-detail-top">
          <Link to="/account/rentals" className="cxq-booking-detail-back">
            <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
            My rentals
          </Link>
        </div>

        {confirmed ? (
          <div className="cxq-booking-detail-alert cxq-booking-detail-alert--success">
            <Check size={18} strokeWidth={2.5} aria-hidden />
            <div>
              <p className="cxq-booking-detail-alert-title">Booking submitted</p>
              <p className="cxq-booking-detail-alert-sub">Complete payment below to confirm your booking.</p>
            </div>
          </div>
        ) : null}

        {showPaymentSuccess ? (
          <PaymentReceivedHero bookingId={booking.id} carLabel={`${booking.carYear} ${booking.carMake} ${booking.carModel}`} />
        ) : null}

        {showPaymentFail ? (
          <PaymentUnsuccessfulHero bookingId={booking.id} onTryAgain={handlePayNow} />
        ) : null}

        <section className="cxq-profile-card cxq-booking-detail-vehicle">
          <div className="cxq-profile-card-head">
            <div>
              <span className="cxq-profile-eyebrow">Your trip</span>
              <h2>Vehicle &amp; booking</h2>
              <p>Pickup reference, vehicle summary, and quick actions.</p>
            </div>
          </div>

          <div className="cxq-booking-detail-hero-grid">
            <div className="cxq-booking-detail-thumb">
              {booking.coverPhotoUrl ? (
                <img src={booking.coverPhotoUrl} alt="" className="cxq-booking-detail-thumb-img" />
              ) : (
                <div className="cxq-booking-detail-thumb-fallback">
                  <Car size={28} strokeWidth={1.75} aria-hidden />
                </div>
              )}
            </div>
            <div className="cxq-booking-detail-hero-main">
              <div className="cxq-rental-top">
                <span className={statusPillClass(booking.customerStatus)}>{statusLabel(booking.customerStatus)}</span>
                <span className="cxq-rental-id">{booking.id}</span>
              </div>
              <h3 className="cxq-booking-detail-car-title">
                {booking.carYear} {booking.carMake} {booking.carModel}
              </h3>
              <p className="cxq-booking-detail-car-sub">
                {booking.carPlateNumber} · {booking.carCategory}
              </p>
              <div className="cxq-rental-meta cxq-booking-detail-meta">
                <span>
                  <Calendar size={11} strokeWidth={2} aria-hidden />
                  <span>
                    {formatDateShort(new Date(booking.startDate))} → {formatDateShort(new Date(booking.endDate))}
                  </span>
                </span>
                <span>
                  <MapPin size={11} strokeWidth={2} aria-hidden />
                  <span>Langkawi</span>
                </span>
                <span>
                  <Wallet size={11} strokeWidth={2} aria-hidden />
                  <span>{formatRM(booking.totalAmountSen)}</span>
                </span>
              </div>
              <div className="cxq-booking-detail-trust">
                <span>
                  <Shield size={12} strokeWidth={2} aria-hidden />
                  Insurance included · free cancellation up to 48&nbsp;h before pickup
                </span>
              </div>
              <div className="cxq-booking-detail-actions">
                {booking.customerStatus === 'Pending Payment' && !showPaymentFail ? (
                  <button type="button" className="button-primary cxq-booking-detail-btn" onClick={handlePayNow}>
                    Pay now <ArrowRight size={14} aria-hidden />
                  </button>
                ) : null}
                <Link
                  to="/book/$carId"
                  params={{ carId: booking.carId }}
                  search={{ startDate: startYmd, endDate: endYmd }}
                  className="button-secondary cxq-booking-detail-btn"
                >
                  Rent again
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="cxq-profile-card">
          <div className="cxq-profile-card-head">
            <div>
              <span className="cxq-profile-eyebrow">Schedule</span>
              <h2>Rental period</h2>
              <p>Dates shown in your local timezone. Contact us if you need to adjust pickup or return.</p>
            </div>
          </div>
          <div className="cxq-booking-detail-dates">
            <div>
              <span className="cxq-booking-detail-dates-lbl">Pickup</span>
              <strong>{formatDateLong(booking.startDate)}</strong>
            </div>
            <div className="cxq-booking-detail-dates-mid">
              <span className="cxq-booking-detail-dates-days">
                {days} day{days !== 1 ? 's' : ''}
              </span>
            </div>
            <div>
              <span className="cxq-booking-detail-dates-lbl">Return</span>
              <strong>{formatDateLong(booking.endDate)}</strong>
            </div>
          </div>
        </section>

        <section className="cxq-profile-card">
          <div className="cxq-profile-card-head">
            <div>
              <span className="cxq-profile-eyebrow">Pricing</span>
              <h2>Payment</h2>
              <p>Rate breakdown for this reservation.</p>
            </div>
          </div>
          <div className="cxq-booking-detail-price">
            {booking.baseRentalSen > 0 ? (
              <>
                {/* Season-based breakdown */}
                <div className="cxq-booking-detail-price-row">
                  <span>Base rental ({days} day{days !== 1 ? 's' : ''})</span>
                  <span>{formatRM(booking.baseRentalSen)}</span>
                </div>
                {booking.extraChargeSen > 0 ? (
                  <div className="cxq-booking-detail-price-row">
                    <span>
                      {booking.extraRule === 'full-day-cap' ? 'Late return (extra day)' : 'Extra hours'}
                    </span>
                    <span>{formatRM(booking.extraChargeSen)}</span>
                  </div>
                ) : null}
                {booking.addonsTotalSen > 0 ? (
                  <div className="cxq-booking-detail-price-row">
                    <span>
                      Add-ons
                      {booking.childSeat && booking.secondDriver
                        ? ' (child seat + extra driver)'
                        : booking.childSeat
                          ? ' (child seat)'
                          : ' (extra driver)'}
                    </span>
                    <span>{formatRM(booking.addonsTotalSen)}</span>
                  </div>
                ) : null}
                {booking.deliveryFeeSen > 0 ? (
                  <div className="cxq-booking-detail-price-row">
                    <span>Delivery fee</span>
                    <span>{formatRM(booking.deliveryFeeSen)}</span>
                  </div>
                ) : null}
                {booking.discountAmountSen > 0 ? (
                  <div className="cxq-booking-detail-price-row cxq-booking-detail-price-row--discount">
                    <span>
                      Discount
                      {booking.couponCode ? ` (${booking.couponCode})` : ''}{' '}
                      {Number(booking.discountPercent) > 0 ? `${booking.discountPercent}%` : ''}
                    </span>
                    <span>− {formatRM(booking.discountAmountSen)}</span>
                  </div>
                ) : null}
              </>
            ) : (
              /* Legacy flat-rate booking */
              <div className="cxq-booking-detail-price-row">
                <span>
                  {formatRM(booking.dailyRateSen)} × {days} day{days !== 1 ? 's' : ''}
                </span>
                <span>{formatRM(booking.totalAmountSen)}</span>
              </div>
            )}
            {booking.depositAmountSen > 0 ? (
              <div className="cxq-booking-detail-price-row">
                <span>Deposit</span>
                <span>{formatRM(booking.depositAmountSen)}</span>
              </div>
            ) : null}
            {booking.paidAmountSen > 0 ? (
              <div className="cxq-booking-detail-price-row cxq-booking-detail-price-row--paid">
                <span>Paid</span>
                <span>− {formatRM(booking.paidAmountSen)}</span>
              </div>
            ) : null}
            <div className="cxq-booking-detail-price-total">
              <span>Total</span>
              <span>{formatRM(booking.totalAmountSen)}</span>
            </div>
          </div>
        </section>

        <p className="cxq-booking-detail-foot">
          Booked on{' '}
          {new Date(booking.createdAt).toLocaleDateString('en-MY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </main>
    </CustomerAccountChrome>
  )
}

const WHATSAPP_HELP = 'https://wa.me/601135215576'

function PaymentReceivedHero({ bookingId, carLabel }: { bookingId: string; carLabel: string }) {
  const [copied, setCopied] = useState(false)

  async function copyId() {
    try {
      await navigator.clipboard.writeText(bookingId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="payment-result-hero payment-result-hero--success">
      <div className="payment-result-icon payment-result-icon--success" aria-hidden>
        <Check size={26} strokeWidth={2.5} />
      </div>
      <span className="payment-result-eyebrow">Step 3 of 3 · You&apos;re booked</span>
      <h2 className="payment-result-title">Payment received</h2>
      <p className="payment-result-sub">
        Your booking is confirmed for <strong className="payment-result-em">{carLabel}</strong>. Keep your booking ID
        for pickup — you should receive a confirmation email shortly.
      </p>
      <div className="payment-result-ref">
        <span>Booking reference</span>
        <strong>{bookingId}</strong>
        <button type="button" className="payment-result-ref-copy" onClick={() => void copyId()}>
          <Copy size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="payment-result-actions">
        <Link to="/account/rentals" className="button-secondary">
          My rentals <ArrowRight size={14} />
        </Link>
        <a href={WHATSAPP_HELP} target="_blank" rel="noreferrer" className="button-secondary">
          <Phone size={14} /> WhatsApp us
        </a>
      </div>
    </div>
  )
}

function PaymentUnsuccessfulHero({ bookingId, onTryAgain }: { bookingId: string; onTryAgain: () => void }) {
  const [copied, setCopied] = useState(false)

  async function copyId() {
    try {
      await navigator.clipboard.writeText(bookingId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="payment-result-hero payment-result-hero--fail">
      <div className="payment-result-icon payment-result-icon--fail" aria-hidden>
        <XCircle size={26} strokeWidth={2.25} />
      </div>
      <span className="payment-result-eyebrow">Payment not completed</span>
      <h2 className="payment-result-title">Payment unsuccessful</h2>
      <p className="payment-result-sub">
        We couldn&apos;t complete your payment — your bank or card issuer may have declined the charge, or the session
        timed out. Your reservation is still on hold: try again with another card or FPX, or message us on WhatsApp
        (we usually reply in under 4 minutes).
      </p>
      <div className="payment-result-ref">
        <span>Booking reference</span>
        <strong>{bookingId}</strong>
        <button type="button" className="payment-result-ref-copy" onClick={() => void copyId()}>
          <Copy size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} aria-hidden />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="payment-result-actions">
        <button type="button" className="button-primary" onClick={onTryAgain}>
          Try payment again <ArrowRight size={14} />
        </button>
        <Link to="/account/rentals" className="button-secondary">
          My rentals
        </Link>
        <a href={WHATSAPP_HELP} target="_blank" rel="noreferrer" className="button-secondary">
          <Phone size={14} /> WhatsApp help
        </a>
      </div>
    </div>
  )
}
