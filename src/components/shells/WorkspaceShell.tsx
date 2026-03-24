import type { ReactNode } from 'react'
import type { AppRole } from '#/lib/auth-model'

import { Link } from '@tanstack/react-router'

import { authClient } from '#/lib/auth-client'
import { getHomePathForRole, getRoleLabel } from '#/lib/auth-model'

type WorkspaceShellProps = {
  title: string
  description: string
  role: AppRole
  children: ReactNode
}

export default function WorkspaceShell({
  title,
  description,
  role,
  children,
}: WorkspaceShellProps) {
  const homePath = getHomePathForRole(role)

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = '/'
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-10">
      <section className="workspace-hero island-shell rise-in">
        <div>
          <p className="island-kicker mb-3">Protected workspace</p>
          <h1 className="display-title mb-4 text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
            {title}
          </h1>
          <p className="m-0 max-w-2xl text-base leading-7 text-[var(--sea-ink-soft)]">
            {description}
          </p>
        </div>

        <div className="workspace-actions">
          <span className="role-pill">{getRoleLabel(role)}</span>
          {role === 'owner' ? (
            <>
              <Link to="/admin" className="button-secondary">
                Admin
              </Link>
              <Link to="/app" className="button-secondary">
                Staff view
              </Link>
            </>
          ) : null}
          {role === 'staff' ? (
            <Link to="/app" className="button-secondary">
              App home
            </Link>
          ) : null}
          {role === 'customer' ? (
            <Link to="/account" className="button-secondary">
              Account home
            </Link>
          ) : null}
          <Link to={homePath} className="button-secondary">
            Refresh route
          </Link>
          <button type="button" onClick={handleSignOut} className="button-primary">
            Sign out
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-4">{children}</section>
    </main>
  )
}
