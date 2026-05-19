import { Link } from '@tanstack/react-router'

import BrandLogo from '#/components/BrandLogo'
import BetterAuthHeader from '#/integrations/better-auth/header-user'
import ThemeToggle from '#/components/ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-3 py-4">
        <Link
          to="/"
          className="brand-mark rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
        >
          <BrandLogo size={28} />
          XQ Car Fleet
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <BetterAuthHeader />
          <ThemeToggle />
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-4 text-sm font-semibold sm:order-2 sm:w-auto">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Home
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
          <Link
            to="/login"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Customer login
          </Link>
          <Link
            to="/internal/login"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Internal login
          </Link>
        </div>
      </nav>
    </header>
  )
}
