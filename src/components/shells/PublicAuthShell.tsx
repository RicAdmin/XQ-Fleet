import '#/components/landing/cxq-landing-scoped.css'
import '#/components/landing/cxq-landing-overrides.css'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { LandingNav, SiteFooter } from '#/components/landing/CxqLandingPage'
import { usePublicI18n } from '#/i18n/usePublicI18n'
import { authClient } from '#/lib/auth-client'

type PublicAuthShellProps = {
  children: ReactNode
  screenLabel?: string
  /** No site nav/footer — only a back control to the homepage. */
  minimal?: boolean
}

export default function PublicAuthShell({
  children,
  screenLabel = 'Car XQ Auth',
  minimal = false,
}: PublicAuthShellProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const user = session?.user
  const [navMenuOpen, setNavMenuOpen] = useState(false)
  const navMenuRef = useRef<HTMLDivElement>(null)
  const { t, href } = usePublicI18n()
  const homePath = href('/')

  useEffect(() => {
    if (minimal) return

    const onDoc = (event: MouseEvent) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target as Node)) {
        setNavMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [minimal])

  if (minimal) {
    return (
      <div className="cxq-landing-page">
        <div className="auth-page auth-page--minimal" data-screen-label={screenLabel}>
          <main className="container auth-page-main auth-page-main--minimal">
            <div className="auth-page-stack">
              <Link to={homePath as '/'} className="auth-page-back">
                <ArrowLeft size={16} strokeWidth={2} aria-hidden />
                <span>{t('common.back')}</span>
              </Link>
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="cxq-landing-page">
      <div className="page auth-page" data-screen-label={screenLabel}>
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

        <main className="container auth-page-main">{children}</main>

        <SiteFooter />
      </div>
    </div>
  )
}
