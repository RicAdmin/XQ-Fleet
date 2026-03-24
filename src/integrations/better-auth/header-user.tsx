import { Link } from '@tanstack/react-router'

import { authClient } from '#/lib/auth-client'
import { getHomePathForRole, getRoleLabel, isAppRole } from '#/lib/auth-model'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-10 w-36 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800" />
  }

  const role = session?.user && isAppRole(session.user.role) ? session.user.role : null

  if (!session?.user || !role) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/register" className="button-secondary">
          Register
        </Link>
        <Link to="/login" className="button-primary">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="role-pill">{getRoleLabel(role)}</span>
      <Link to={getHomePathForRole(role)} className="button-secondary">
        Workspace
      </Link>
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut()
          window.location.href = '/'
        }}
        className="button-primary"
      >
        Sign out
      </button>
    </div>
  )
}
