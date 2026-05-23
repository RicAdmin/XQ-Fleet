import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { useEffect, useRef, useState } from 'react'

import { Outlet, createFileRoute } from '@tanstack/react-router'

import { LandingNav, SiteFooter } from '#/components/landing/CxqLandingPage'
import { authClient } from '#/lib/auth-client'
import { getCustomerBookings, getPortalCustomerProfile } from '#/lib/portal-booking-functions'
import { requireSurfaceAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => requireSurfaceAccess('account'),
  loader: async () => {
    const [bookings, portalCustomer] = await Promise.all([
      getCustomerBookings(),
      getPortalCustomerProfile(),
    ])
    return { bookings, portalCustomer }
  },
  component: CustomerAccountOutlet,
})

function CustomerAccountOutlet() {
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

  return (
    <div className="cxq-landing-page">
      <div className="page" data-screen-label="XQ Car Account">
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

        <Outlet />

        <SiteFooter />
      </div>
    </div>
  )
}
