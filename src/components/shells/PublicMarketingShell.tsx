import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { LandingNav, SiteFooter } from '#/components/landing/CxqLandingPage'
import { authClient } from '#/lib/auth-client'

type PublicMarketingShellProps = {
  children: ReactNode
  screenLabel?: string
  mainClassName?: string
}

/** Public pages that share the main landing nav, typography, and footer. */
export default function PublicMarketingShell({
  children,
  screenLabel = 'XQ Car',
  mainClassName = 'container',
}: PublicMarketingShellProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const user = session?.user
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setNavMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="cxq-landing-page">
      <div className="page" data-screen-label={screenLabel}>
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

        <main className={mainClassName}>{children}</main>

        <SiteFooter />
      </div>
    </div>
  )
}
