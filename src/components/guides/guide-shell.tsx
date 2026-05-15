import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

import { SiteFooter } from '#/components/landing/CxqLandingPage'

import '../landing/cxq-landing-scoped.css'
import '../landing/cxq-landing-overrides.css'

export function GuidePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="cxq-landing-page cxq-guide-app">
      <div className="page-shell-guide" data-screen-label="Guide">
        {children}
        <SiteFooter />
      </div>
    </div>
  )
}

export function GuidePageHeader({
  kicker,
  title,
  body,
}: {
  kicker: string
  title: string
  body: string
}) {
  return (
    <header className="page-header dark">
      <Link to="/" className="close-btn page-back" aria-label="Back to home">
        <ArrowLeft size={16} />
      </Link>
      <div className="page-header-inner">
        <span className="page-eyebrow">{kicker}</span>
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </header>
  )
}
