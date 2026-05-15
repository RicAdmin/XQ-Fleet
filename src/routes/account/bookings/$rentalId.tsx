import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Car, CheckCircle, XCircle } from 'lucide-react'
import { z } from 'zod'

import { getBookingDetail } from '#/lib/portal-booking-functions'

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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function BookingDetailPage() {
  const { booking } = Route.useLoaderData()
  const { confirmed, payment } = Route.useSearch()
  const navigate = useNavigate()

  const days = Math.ceil(
    (new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / 86_400_000,
  )

  function handlePayNow() {
    navigate({ to: '/pay/$rentalId', params: { rentalId: booking.id } })
  }

  return (
    <div className="hub-layout">
      <div className="hub-content">
        <div className="hub-subpage-header">
          <Link to="/account/rentals" className="hub-back-link">
            <ArrowLeft size={16} />
            My rentals
          </Link>
          <h1 className="hub-subpage-title">Booking detail</h1>
        </div>

        {/* Confirmation banner */}
        {confirmed ? (
          <div className="booking-confirmed-banner">
            <CheckCircle size={20} className="booking-confirmed-icon" />
            <div>
              <p className="booking-confirmed-title">Booking submitted!</p>
              <p className="booking-confirmed-sub">
                Complete payment below to confirm your booking.
              </p>
            </div>
          </div>
        ) : null}

        {/* Payment result banner */}
        {payment === 'response' && booking.customerStatus === 'Confirmed' ? (
          <div className="booking-confirmed-banner">
            <CheckCircle size={20} className="booking-confirmed-icon" />
            <div>
              <p className="booking-confirmed-title">Payment received!</p>
              <p className="booking-confirmed-sub">Your booking is confirmed.</p>
            </div>
          </div>
        ) : null}

        {payment === 'error' || (payment === 'response' && booking.customerStatus === 'Pending Payment') ? (
          <div className="booking-failed-banner">
            <XCircle size={20} className="booking-failed-icon" />
            <div>
              <p className="booking-failed-title">Payment unsuccessful</p>
              <p className="booking-failed-sub">
                Your payment could not be processed. Please try again.
              </p>
            </div>
          </div>
        ) : null}

        {/* Status */}
        <div className="hub-detail-status island-shell">
          <div>
            <p className="hub-detail-label">Status</p>
            <span className={`status-badge status-lg ${getStatusClass(booking.customerStatus)}`}>
              {booking.customerStatus}
            </span>
          </div>
          {booking.customerStatus === 'Pending Payment' ? (
            <button type="button" className="button-primary" onClick={handlePayNow}>
              Pay now
            </button>
          ) : null}
        </div>

        {/* Car info */}
        <div className="hub-detail-car island-shell">
          {booking.coverPhotoUrl ? (
            <img
              src={booking.coverPhotoUrl}
              alt={`${booking.carMake} ${booking.carModel}`}
              className="hub-detail-car-photo"
            />
          ) : (
            <div className="hub-detail-car-photo-placeholder">
              <Car size={32} />
            </div>
          )}
          <div>
            <p className="hub-detail-car-name">
              {booking.carYear} {booking.carMake} {booking.carModel}
            </p>
            <p className="hub-detail-car-plate">{booking.carPlateNumber}</p>
            <p className="hub-detail-car-category">{booking.carCategory}</p>
          </div>
        </div>

        {/* Rental period */}
        <div className="hub-detail-section island-shell">
          <h2 className="hub-detail-section-title">Rental period</h2>
          <div className="hub-detail-grid">
            <div>
              <p className="hub-detail-label">Pickup</p>
              <p className="hub-detail-value">{formatDate(booking.startDate)}</p>
            </div>
            <div>
              <p className="hub-detail-label">Return</p>
              <p className="hub-detail-value">{formatDate(booking.endDate)}</p>
            </div>
            <div>
              <p className="hub-detail-label">Duration</p>
              <p className="hub-detail-value">{days} day{days !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="hub-detail-section island-shell">
          <h2 className="hub-detail-section-title">Payment</h2>
          <div className="hub-detail-breakdown">
            <div className="hub-detail-breakdown-row">
              <span>{formatRM(booking.dailyRateSen)} × {days} day{days !== 1 ? 's' : ''}</span>
              <span>{formatRM(booking.totalAmountSen)}</span>
            </div>
            {booking.depositAmountSen > 0 && (
              <div className="hub-detail-breakdown-row">
                <span>Deposit</span>
                <span>{formatRM(booking.depositAmountSen)}</span>
              </div>
            )}
            {booking.paidAmountSen > 0 && (
              <div className="hub-detail-breakdown-row hub-detail-paid-row">
                <span>Paid</span>
                <span>− {formatRM(booking.paidAmountSen)}</span>
              </div>
            )}
            <div className="hub-detail-breakdown-total">
              <span>Total</span>
              <span>{formatRM(booking.totalAmountSen)}</span>
            </div>
          </div>
        </div>

        <p className="hub-detail-created">
          Booked on{' '}
          {new Date(booking.createdAt).toLocaleDateString('en-MY', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}

function getStatusClass(status: string) {
  switch (status) {
    case 'Active': return 'status-active'
    case 'Confirmed': return 'status-confirmed'
    case 'Pending Payment': return 'status-pending'
    case 'Completed': return 'status-closed'
    case 'Cancelled': return 'status-cancelled'
    default: return ''
  }
}
