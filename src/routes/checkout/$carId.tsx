import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { useEffect, useMemo, useRef, useState } from 'react'

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { LandingNav, SiteFooter } from '#/components/landing/CxqLandingPage'
import { LandingCheckoutFlow, type BookingState } from '#/components/landing/LandingCheckoutFlow'
import { toLocalYmd } from '#/lib/booking-datetime'
import {
  bookingHasCompleteTrip,
  resolveCheckoutBooking,
  type CheckoutTripSearch,
} from '#/lib/checkout-trip'
import { authClient } from '#/lib/auth-client'
import { saveTripSearch } from '#/lib/trip-search-storage'
import { getPublicCarDetail, type PublicCarDetail, type PublicCarRow } from '#/lib/portal-functions'

const checkoutSearchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  from: z.string().optional(),
  retLoc: z.string().optional(),
  tripType: z.enum(['round', 'oneway']).optional(),
  pickTime: z.string().optional(),
  retTime: z.string().optional(),
  adults: z.string().optional(),
  children: z.string().optional(),
})

function detailToRow(car: PublicCarDetail): PublicCarRow {
  const cover = car.photos.find((p) => p.isCover)?.url ?? car.photos[0]?.url ?? null
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    year: car.year,
    category: car.category,
    dailyRateSen: car.dailyRateSen,
    extHourLowSen: car.extHourLowSen,
    extHourPeakAndSuperPeakSen: car.extHourPeakAndSuperPeakSen,
    coverPhotoUrl: cover,
    notes: car.notes,
  }
}

export const Route = createFileRoute('/checkout/$carId')({
  validateSearch: checkoutSearchSchema,
  loader: async ({ params }) => {
    const car = await getPublicCarDetail({ data: { carId: params.carId } })
    if (!car) throw redirect({ to: '/' })
    return { carRow: detailToRow(car) }
  },
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const search = Route.useSearch() as CheckoutTripSearch
  const { carRow } = Route.useLoaderData()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const user = session?.user

  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) setNavMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
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
      <div className="page page--checkout" data-screen-label="Car XQ Checkout">
        <div className="layout-bleed cxq-checkout-nav-strip">
          <LandingNav
            appearance="solid-light"
            sectionLinks="home"
            sessionPending={sessionPending}
            user={user}
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
            user={user ? { name: user.name, email: user.email } : undefined}
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
