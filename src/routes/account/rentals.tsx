import { useMemo, useState } from 'react'

import { Link, getRouteApi, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Calendar, Car, MapPin, Wallet } from 'lucide-react'

import CustomerAccountChrome from '#/components/portal/CustomerAccountChrome'

import type { BookingListItem, CustomerFacingStatus } from '#/lib/portal-booking-functions'

const accountRouteApi = getRouteApi('/account')

type RentalFilter = 'upcoming' | 'past' | 'all'

export const Route = createFileRoute('/account/rentals')({
  component: AccountRentalsPage,
})

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function isPastBooking(b: BookingListItem) {
  const end = new Date(b.endDate)
  end.setHours(23, 59, 59, 999)
  const today = startOfToday()
  if (end < today) return true
  return b.customerStatus === 'Completed' || b.customerStatus === 'Cancelled'
}

function isUpcomingBooking(b: BookingListItem) {
  return !isPastBooking(b)
}

function filterBookings(list: BookingListItem[], filter: RentalFilter) {
  if (filter === 'all') return list
  if (filter === 'past') return list.filter(isPastBooking)
  return list.filter(isUpcomingBooking)
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

function formatShort(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function AccountRentalsPage() {
  const { session } = Route.useRouteContext()
  const { bookings, portalCustomer } = accountRouteApi.useLoaderData()
  const [filter, setFilter] = useState<RentalFilter>('upcoming')

  const displayPhone = portalCustomer?.phone ?? ''

  const filtered = useMemo(() => filterBookings(bookings, filter), [bookings, filter])

  return (
    <CustomerAccountChrome
      session={session}
      bookingsCount={bookings.length}
      displayPhone={displayPhone}
    >
      <main className="cxq-profile-body">
        {bookings.length === 0 ? (
          <div className="cxq-profile-empty">
            <div className="cxq-profile-empty-icon" aria-hidden>
              <Car size={28} strokeWidth={1.75} />
            </div>
            <h3>No rentals yet.</h3>
            <p>When you reserve a car, your trip will land here — with one-tap re-rent for next time.</p>
            <Link to="/" className="button-primary cxq-profile-empty-cta">
              Browse cars
              <ArrowRight size={13} strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="cxq-profile-rentals">
            <div className="cxq-profile-rental-head">
              <h3>
                {bookings.length} rental{bookings.length === 1 ? '' : 's'}
              </h3>
              <div className="cxq-profile-rental-tabs" role="tablist" aria-label="Filter rentals">
                {(
                  [
                    ['upcoming', 'Upcoming'],
                    ['past', 'Past'],
                    ['all', 'All'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={filter === id}
                    className={'cxq-profile-chip' + (filter === id ? ' cxq-profile-chip--on' : '')}
                    onClick={() => setFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="cxq-profile-empty cxq-profile-empty--soft">
                <p className="cxq-profile-empty-copy">Nothing in this tab yet.</p>
                <button type="button" className="cxq-profile-linkish" onClick={() => setFilter('all')}>
                  Show all rentals
                </button>
              </div>
            ) : (
              <ul className="cxq-rental-list">
                {[...filtered].map((b) => (
                  <li key={b.id} className="cxq-rental-row">
                    <div className="cxq-rental-thumb">
                      {b.coverPhotoUrl ? (
                        <img src={b.coverPhotoUrl} alt="" className="cxq-rental-thumb-img" />
                      ) : (
                        <Car size={22} className="cxq-rental-thumb-fallback" aria-hidden />
                      )}
                    </div>
                    <div className="cxq-rental-body">
                      <div className="cxq-rental-top">
                        <span className="cxq-rental-status">{statusLabel(b.customerStatus)}</span>
                        <span className="cxq-rental-id">{b.id.slice(0, 8)}</span>
                      </div>
                      <h3>
                        {b.carYear} {b.carMake} {b.carModel}
                      </h3>
                      <div className="cxq-rental-meta">
                        <span>
                          <Calendar size={11} strokeWidth={2} aria-hidden />
                          <span>
                            {formatShort(b.startDate)} → {formatShort(b.endDate)}
                          </span>
                        </span>
                        <span>
                          <MapPin size={11} strokeWidth={2} aria-hidden />
                          <span>Langkawi</span>
                        </span>
                        <span>
                          <Wallet size={11} strokeWidth={2} aria-hidden />
                          <span>RM {(b.totalAmountSen / 100).toFixed(2)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="cxq-rental-actions">
                      <Link
                        to="/account/bookings/$rentalId"
                        params={{ rentalId: b.id }}
                        className="button-secondary cxq-rental-btn"
                      >
                        View details
                      </Link>
                      <Link to="/book/$carId" params={{ carId: b.carId }} className="button-primary cxq-rental-btn">
                        Rent again
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </CustomerAccountChrome>
  )
}
