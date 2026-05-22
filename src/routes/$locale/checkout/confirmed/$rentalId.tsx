import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Check, XCircle } from 'lucide-react'
import { z } from 'zod'

import { SiteFooter } from '#/components/landing/CxqLandingPage'
import { getGuestBookingSummary } from '#/lib/portal-booking-functions'

export const Route = createFileRoute('/$locale/checkout/confirmed/$rentalId')({
  validateSearch: z.object({
    payment: z.enum(['response', 'error']).optional(),
  }),
  loader: async ({ params }) => {
    const booking = await getGuestBookingSummary({ data: { rentalId: params.rentalId } })
    return { booking, rentalId: params.rentalId }
  },
  component: GuestBookingConfirmedPage,
})

function formatRM(amountSen: number) {
  return `RM ${(amountSen / 100).toFixed(2)}`
}

function GuestBookingConfirmedPage() {
  const { booking, rentalId } = Route.useLoaderData()
  const { payment } = Route.useSearch()
  const navigate = useNavigate()

  if (!booking) {
    return (
      <div className="cxq-landing-page">
        <div className="page page--checkout" data-screen-label="Car XQ Guest Booking">
          <div className="checkout-page-frame">
            <div className="checkout">
              <div className="checkout-section">
                <div className="confirmation-hero">
                  <div
                    className="confirmation-tick"
                    style={{ background: 'rgba(255,102,0,.12)', color: 'var(--brand-coral)' }}
                  >
                    <XCircle size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-coral)' }}>
                    Booking not found
                  </span>
                  <h2 className="h-section">We couldn&apos;t load this booking.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    The reference may be invalid or expired. If you just paid, wait a moment and refresh — or contact
                    us with your booking ID.
                  </p>
                  <div className="confirmation-id">
                    <span>Reference</span>
                    <strong>{rentalId.slice(0, 8).toUpperCase()}</strong>
                  </div>
                  <Link to="/" className="btn btn-leaf btn-lg" style={{ marginTop: 18 }}>
                    Back to homepage <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <SiteFooter />
        </div>
      </div>
    )
  }

  const showPaymentSuccess = payment === 'response' && booking.customerStatus === 'Confirmed'
  const showPaymentPending =
    payment === 'response' && booking.customerStatus === 'Pending Payment'
  const showPaymentFail = payment === 'error'

  return (
    <div className="cxq-landing-page">
      <div className="page page--checkout" data-screen-label="Car XQ Guest Booking">
        <div className="checkout-page-frame">
          <div className="checkout">
            <div className="checkout-section">
              {showPaymentSuccess ? (
                <div className="confirmation-hero">
                  <div className="confirmation-tick">
                    <Check size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-leaf)' }}>
                    Payment received
                  </span>
                  <h2 className="h-section">Your booking is confirmed.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Show your booking reference at pickup. We&apos;ve sent a confirmation to your email.
                  </p>
                  <div className="confirmation-id">
                    <span>Booking ref</span>
                    <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
                  </div>
                </div>
              ) : showPaymentPending ? (
                <div className="confirmation-hero">
                  <div className="confirmation-tick">
                    <Check size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-leaf)' }}>
                    Payment received
                  </span>
                  <h2 className="h-section">We&apos;re confirming your booking.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Your payment was submitted successfully. This page will update once confirmation is complete — you
                    can also refresh in a minute.
                  </p>
                  <div className="confirmation-id">
                    <span>Booking ref</span>
                    <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
                  </div>
                </div>
              ) : showPaymentFail ? (
                <div className="confirmation-hero">
                  <div
                    className="confirmation-tick"
                    style={{ background: 'rgba(255,102,0,.12)', color: 'var(--brand-coral)' }}
                  >
                    <XCircle size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-coral)' }}>
                    Payment incomplete
                  </span>
                  <h2 className="h-section">We couldn&apos;t confirm payment.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Your booking is still held briefly. Try payment again or contact us if you need help.
                  </p>
                  <div className="confirmation-id">
                    <span>Booking ref</span>
                    <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-leaf btn-lg"
                    style={{ marginTop: 18 }}
                    onClick={() => void navigate({ to: '/pay/$rentalId', params: { rentalId: booking.id } })}
                  >
                    Try payment again <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <div className="confirmation-hero">
                  <div className="confirmation-tick">
                    <Check size={26} />
                  </div>
                  <span className="eyebrow" style={{ color: 'var(--brand-leaf)' }}>
                    Booking saved
                  </span>
                  <h2 className="h-section">You&apos;re almost there.</h2>
                  <p className="h-sub" style={{ marginTop: 4 }}>
                    Complete payment to confirm your {booking.carYear} {booking.carMake} {booking.carModel} rental.
                  </p>
                  <div className="confirmation-id">
                    <span>Booking ref</span>
                    <strong>{booking.id.slice(0, 8).toUpperCase()}</strong>
                  </div>
                </div>
              )}

              <section className="checkout-card">
                <div className="checkout-card-head">
                  <h3>Trip summary</h3>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>
                  {booking.carYear} {booking.carMake} {booking.carModel}
                  <br />
                  {new Date(booking.startDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  {' → '}
                  {new Date(booking.endDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  <br />
                  Total: <strong style={{ color: 'var(--ink)' }}>{formatRM(booking.totalAmountSen)}</strong>
                </p>
              </section>

              {!showPaymentSuccess ? (
                <div className="cs-pay-actions">
                  <button
                    type="button"
                    className="btn btn-leaf btn-lg"
                    onClick={() => void navigate({ to: '/pay/$rentalId', params: { rentalId: booking.id } })}
                  >
                    Pay {formatRM(booking.totalAmountSen)} <ArrowRight size={14} />
                  </button>
                </div>
              ) : null}

              <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                Want to track bookings later?{' '}
                <Link to="/register" className="checkout-edit">
                  Create an account
                </Link>{' '}
                with the same email.
              </p>
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </div>
  )
}
