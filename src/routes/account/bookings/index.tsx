import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Car } from 'lucide-react'

import { getCustomerBookings } from '#/lib/portal-booking-functions'

export const Route = createFileRoute('/account/bookings/')({
  loader: async () => {
    const bookings = await getCustomerBookings()
    return { bookings }
  },
  component: BookingsListPage,
})

function BookingsListPage() {
  const { bookings } = Route.useLoaderData()

  return (
    <div className="hub-layout">
      <div className="hub-content">
        <div className="hub-subpage-header">
          <Link to="/account" className="hub-back-link">
            <ArrowLeft size={16} />
            My account
          </Link>
          <h1 className="hub-subpage-title">My bookings</h1>
        </div>

        {bookings.length === 0 ? (
          <div className="hub-rental-empty island-shell">
            <Car size={22} className="hub-rental-icon" />
            <p className="hub-rental-headline">No bookings yet</p>
            <p className="hub-rental-sub">Your bookings will appear here once you reserve a car.</p>
            <Link to="/" className="button-primary">
              Browse cars
            </Link>
          </div>
        ) : (
          <div className="hub-bookings-full-list">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                to="/account/bookings/$rentalId"
                params={{ rentalId: booking.id }}
                className="hub-booking-full-row island-shell"
              >
                <div className="hub-booking-thumb">
                  {booking.coverPhotoUrl ? (
                    <img
                      src={booking.coverPhotoUrl}
                      alt={`${booking.carMake} ${booking.carModel}`}
                      className="hub-car-thumb-img"
                    />
                  ) : (
                    <Car size={22} />
                  )}
                </div>
                <div className="hub-booking-info">
                  <p className="hub-car-name">
                    {booking.carYear} {booking.carMake} {booking.carModel}
                  </p>
                  <p className="hub-booking-dates">
                    {new Date(booking.startDate).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {' → '}
                    {new Date(booking.endDate).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="hub-booking-amount">
                    RM {(booking.totalAmountSen / 100).toFixed(2)}
                  </p>
                </div>
                <span className={`status-badge ${getStatusClass(booking.customerStatus)}`}>
                  {booking.customerStatus}
                </span>
              </Link>
            ))}
          </div>
        )}
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
