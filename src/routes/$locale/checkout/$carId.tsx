import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { useEffect, useMemo, useRef, useState } from 'react'

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'

import { LandingNav, SiteFooter } from '#/components/landing/CxqLandingPage'
import { LandingCheckoutFlow, type BookingState } from '#/components/landing/LandingCheckoutFlow'
import { LoadingSpinner } from '#/components/ui/LoadingSpinner'
import { toLocalYmd } from '#/lib/booking-datetime'
import {
  bookingHasCompleteTrip,
  parseCheckoutSearch,
  resolveCheckoutBooking,
  type CheckoutTripSearch,
} from '#/lib/checkout-trip'
import { authClient } from '#/lib/auth-client'
import { getRequestSession } from '#/lib/auth-functions'
import { toCheckoutCustomer } from '#/lib/checkout-session'
import { saveTripSearch } from '#/lib/trip-search-storage'
import { getPublicCarDetail, publicCarDetailToRow } from '#/lib/portal-functions'

export const Route = createFileRoute('/$locale/checkout/$carId')({
  validateSearch: parseCheckoutSearch,
  loader: async ({ params }) => {
    const [car, session] = await Promise.all([
      getPublicCarDetail({ data: { carId: params.carId } }),
      getRequestSession(),
    ])
    if (!car) throw redirect({ to: '/' })
    const authUser = toCheckoutCustomer(session?.user) ?? null
    return { carRow: publicCarDetailToRow(car), authUser }
  },
  pendingComponent: CheckoutRoutePending,
  component: CheckoutPage,
})

function CheckoutRoutePending() {
  return (
    <div className="cxq-landing-page">
      <div className="page page--checkout cxq-route-loading" data-screen-label="XQ Car Checkout">
        <LoadingSpinner size={32} label="Loading checkout" />
        <p className="cxq-route-loading-text">Loading checkout…</p>
      </div>
    </div>
  )
}

function CheckoutPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as CheckoutTripSearch
  const { carRow, authUser } = Route.useLoaderData()
  const { data: session, isPending: clientSessionPending } = authClient.useSession()

  const checkoutUser = useMemo(
    () => toCheckoutCustomer(session?.user) ?? authUser ?? undefined,
    [session?.user, authUser],
  )
  /** Wait for client session fetch before showing the login gate (server session may already be set). */
  const sessionPending = clientSessionPending && !checkoutUser

  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) setNavMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    void authClient.getSession()
  }, [])

  const booking = useMemo(() => resolveCheckoutBooking(search), [search])
  const startYmd = toLocalYmd(booking.pickDate)
  const endYmd = toLocalYmd(booking.retDate)

  useEffect(() => {
    if (!bookingHasCompleteTrip(booking)) return
    saveTripSearch(booking, booking)
  }, [booking])

  return (
    <div className="cxq-landing-page">
      <div className="page page--checkout" data-screen-label="XQ Car Checkout">
        <div className="layout-bleed cxq-checkout-nav-strip">
          <LandingNav
            appearance="solid-light"
            sectionLinks="home"
            sessionPending={sessionPending}
            user={checkoutUser}
            navMenuOpen={navMenuOpen}
            setNavMenuOpen={setNavMenuOpen}
            navMenuRef={navMenuRef}
          />
        </div>

        <div className="checkout-page-frame">
          <LandingCheckoutFlow
            car={carRow}
            booking={booking}
            startYmd={startYmd}
            endYmd={endYmd}
            user={checkoutUser}
            sessionPending={sessionPending}
            backHref="/"
          />
        </div>

        <SiteFooter
          onScrollBooking={() => {
            void navigate({ to: '/', hash: 'booking-dock' })
          }}
          onScrollFleet={() => {
            void navigate({ to: '/', hash: 'top-picks' })
          }}
        />
      </div>
    </div>
  )
}
