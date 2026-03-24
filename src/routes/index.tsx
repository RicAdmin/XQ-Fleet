import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Building2, KeyRound, ShieldCheck } from 'lucide-react'

import PublicPageShell from '#/components/shells/PublicPageShell'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <PublicPageShell>
      <section className="hero-grid rise-in">
        <div className="hero-copy island-shell rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
          <p className="island-kicker mb-3">Stage 1 foundation</p>
          <h1 className="display-title mb-5 text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-6xl">
            Log in fast. Route people to the right workspace. Keep access under control.
          </h1>
          <p className="mb-8 max-w-2xl text-base leading-8 text-[var(--sea-ink-soft)] sm:text-lg">
            XQ Car Fleet is now set up to separate owner, staff, and customer access with a cleaner public entry, an internal login, and protected proof pages for each role.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login" className="button-primary">
              Customer portal
              <ArrowRight size={16} />
            </Link>
            <Link to="/internal/login" className="button-secondary">
              Staff and owner login
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            {
              icon: KeyRound,
              title: 'Customer access',
              description: 'Simple sign-up and sign-in for customer accounts with their own protected account route.',
            },
            {
              icon: Building2,
              title: 'Internal access',
              description: 'Owners and staff use a separate internal login so operational access stays distinct from the public portal.',
            },
            {
              icon: ShieldCheck,
              title: 'Role-aware routing',
              description: 'Protected routes redirect by role so people land in the right area instead of guessing where to go.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <article key={title} className="feature-card rounded-[1.7rem] p-5">
              <div className="mb-4 inline-flex rounded-2xl border border-[var(--line)] bg-white/70 p-3 text-[var(--lagoon-deep)]">
                <Icon size={20} />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-[var(--sea-ink)]">{title}</h2>
              <p className="m-0 text-sm leading-7 text-[var(--sea-ink-soft)]">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  )
}
