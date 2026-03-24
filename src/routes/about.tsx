import { createFileRoute } from '@tanstack/react-router'

import PublicPageShell from '#/components/shells/PublicPageShell'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <PublicPageShell>
      <section className="island-shell rise-in rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <p className="island-kicker mb-3">About the platform</p>
        <h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          A rental operations system built to replace paper records.
        </h1>
        <div className="grid gap-6 text-base leading-8 text-[var(--sea-ink-soft)] sm:grid-cols-2">
          <p className="m-0">
            Stage 1 establishes the identity layer for XQ Car Fleet: role-aware access, separate internal and customer entry points, and the production schema foundations the rest of the system will build on.
          </p>
          <p className="m-0">
            Owners get administrative access, staff get operational access, and customers get a separate protected account route. That separation is now part of the application structure instead of just being a plan on paper.
          </p>
        </div>
      </section>
    </PublicPageShell>
  )
}
