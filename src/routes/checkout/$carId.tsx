import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { useEffect, useMemo, useRef, useState } from 'react'

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { LandingNav, SiteFooter } from '#/components/landing/CxqLandingPage'
import { LandingCheckoutFlow, type BookingState } from '#/components/landing/LandingCheckoutFlow'
import { authClient } from '#/lib/auth-client'
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

function defaultBooking(): BookingState {
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
    pickTime: '07:00 AM',
    retTime: '07:00 AM',
    adults: 2,
    children: 0,
  }
}

function parseYmd(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function bookingFromSearch(search: z.infer<typeof checkoutSearchSchema>): BookingState {
  const base = defaultBooking()
  const d1 = parseYmd(search.startDate) ?? base.pickDate
  const d2 = parseYmd(search.endDate) ?? base.retDate
  const adults = search.adults != null ? Number.parseInt(search.adults, 10) : base.adults
  const children = search.children != null ? Number.parseInt(search.children, 10) : base.children
  return {
    from: search.from ?? base.from,
    retLoc: search.retLoc ?? base.retLoc,
    tripType: search.tripType ?? base.tripType,
    pickDate: d1,
    retDate: d2,
    pickTime: search.pickTime ?? base.pickTime,
    retTime: search.retTime ?? base.retTime,
    adults: Number.isFinite(adults) ? Math.min(9, Math.max(1, adults)) : base.adults,
    children: Number.isFinite(children) ? Math.min(8, Math.max(0, children)) : base.children,
  }
}

function toYmd(d: Date | null) {
  if (!d) return undefined
  return d.toISOString().slice(0, 10)
}

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
  const search = Route.useSearch()
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

  const booking = useMemo(() => bookingFromSearch(search), [search])
  const startYmd = toYmd(booking.pickDate)
  const endYmd = toYmd(booking.retDate)

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
