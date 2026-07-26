import { Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { isPublicInternalPath } from '#/lib/internal-routes'
import { useForceLightTheme } from '#/lib/theme-mode'
import { requireInternalAccess } from '#/lib/route-guards'

import '#/styles/admin-ui.css'

function InternalWorkspaceRoot({ children }: { children: ReactNode }) {
  useForceLightTheme()
  return <div className="cxq-dashboard-root admin-shell">{children}</div>
}

export const Route = createFileRoute('/internal')({
  beforeLoad: async ({ location, cause }) => {
    if (isPublicInternalPath(location.pathname)) {
      return
    }
    return requireInternalAccess({ cause })
  },
  component: InternalLayout,
  errorComponent: ({ error, reset }) => (
    <InternalWorkspaceRoot>
      <ErrorPanel
        title="Something went wrong in the workspace"
        message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
        onRetry={reset}
      />
    </InternalWorkspaceRoot>
  ),
})

function InternalLayout() {
  const { pathname } = useLocation()

  if (isPublicInternalPath(pathname)) {
    return <Outlet />
  }

  return (
    <InternalWorkspaceRoot>
      <Outlet />
    </InternalWorkspaceRoot>
  )
}
