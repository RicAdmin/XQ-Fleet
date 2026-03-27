import type { ReactNode } from 'react'

import { Link } from '@tanstack/react-router'

import Footer from '#/components/Footer'

export default function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page-root">
      <header className="auth-page-nav">
        <div className="auth-page-nav-inner page-wrap px-4">
          <Link to="/" className="auth-page-brand">
            XQ Car Fleet
          </Link>
          <Link to="/" className="auth-page-back">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="auth-page-main page-wrap px-4">{children}</main>

      <Footer />
    </div>
  )
}
