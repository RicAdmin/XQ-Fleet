import { Link, createFileRoute } from '@tanstack/react-router'
import { Car, ChevronRight, Clock, History, LogOut } from 'lucide-react'

import { authClient } from '#/lib/auth-client'
import { getCustomerBookings } from '#/lib/portal-booking-functions'

export const Route = createFileRoute('/account/')({
  loader: async () => {
    const bookings = await getCustomerBookings()
    return { bookings }
  },
  component: AccountIndexPage,
})

function AccountIndexPage() {
  const { session } = Route.useRouteContext()
  const { bookings } = Route.useLoaderData()
  const navigate = Route.useNavigate()

  const activeBooking = bookings.find(
    (b) => b.customerStatus === 'Active' || b.customerStatus === 'Confirmed',
  )
  const pendingBookings = bookings.filter((b) => b.customerStatus === 'Pending Payment')
  const recentBookings = bookings.slice(0, 3)

  async function handleSignOut() {
    await authClient.signOut()
    await navigate({ to: '/' })
  }

  return (
    <div className="hub-layout">
      <header className="hub-topbar">
        <div className="hub-brand">
          <Car size={15} />
          <span>XQ Fleet</span>
        </div>
        <div className="hub-topbar-end">
          <span className="role-pill">Customer</span>
          <button
            type="button"
            className="hub-signout"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <div className="hub-content">
        <div className="hub-greeting">
          <p className="hub-greeting-text">
            Welcome back, <strong>{session.user.name}</strong>
          </p>
          <p className="hub-greeting-sub">Manage your bookings and browse available cars.</p>
        </div>

        {/* Active / confirmed booking */}
        <section className="hub-section">
          <p className="hub-section-title">Current booking</p>
          {activeBooking ? (
            <Link
              to="/account/bookings/$rentalId"
              params={{ rentalId: activeBooking.id }}
              className="hub-active-booking island-shell"
            >
              <div className="hub-active-car-info">
                <p className="hub-car-name">
                  {activeBooking.carYear} {activeBooking.carMake} {activeBooking.carModel}
                </p>
                <p className="hub-car-rate">
                  {new Date(activeBooking.startDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                  })}
                  {' → '}
                  {new Date(activeBooking.endDate).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span
                className={`status-badge ${activeBooking.customerStatus === 'Active' ? 'status-active' : 'status-pending'}`}
              >
                {activeBooking.customerStatus}
              </span>
            </Link>
          ) : (
            <div className="hub-rental-empty island-shell">
              <Clock size={22} className="hub-rental-icon" />
              <p className="hub-rental-headline">No active booking</p>
              <p className="hub-rental-sub">Browse available cars to plan your next trip.</p>
              <Link to="/" className="button-primary">
                Browse cars
              </Link>
            </div>
          )}
        </section>

        {/* Pending payment alert */}
        {pendingBookings.length > 0 && (
          <section className="hub-section">
            <div className="hub-pending-alert">
              <p className="hub-pending-title">
                {pendingBookings.length === 1
                  ? '1 booking awaiting payment'
                  : `${pendingBookings.length} bookings awaiting payment`}
              </p>
              <Link to="/account/bookings" className="hub-see-all">
                View <ChevronRight size={12} />
              </Link>
            </div>
          </section>
        )}

        {/* Recent bookings */}
        {recentBookings.length > 0 && (
          <section className="hub-section">
            <div className="hub-section-header">
              <p className="hub-section-title">Recent bookings</p>
              <Link to="/account/bookings" className="hub-see-all">
                See all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="hub-booking-list">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  to="/account/bookings/$rentalId"
                  params={{ rentalId: booking.id }}
                  className="hub-booking-row island-shell"
                >
                  <div className="hub-car-thumb">
                    {booking.coverPhotoUrl ? (
                      <img src={booking.coverPhotoUrl} alt="" className="hub-car-thumb-img" />
                    ) : (
                      <Car size={18} />
                    )}
                  </div>
                  <div className="hub-car-info">
                    <p className="hub-car-name">
                      {booking.carYear} {booking.carMake} {booking.carModel}
                    </p>
                    <p className="hub-car-rate">
                      {new Date(booking.startDate).toLocaleDateString('en-MY', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`status-badge ${getStatusClass(booking.customerStatus)}`}
                  >
                    {booking.customerStatus}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section className="hub-section">
          <p className="hub-section-title">Account</p>
          <div className="hub-account-links">
            <Link to="/account/bookings" className="hub-account-link">
              <History size={16} />
              <span>My bookings</span>
              <ChevronRight size={14} className="ml-auto" />
            </Link>
            <Link to="/" className="hub-account-link">
              <Car size={16} />
              <span>Browse cars</span>
              <ChevronRight size={14} className="ml-auto" />
            </Link>
          </div>
        </section>
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
