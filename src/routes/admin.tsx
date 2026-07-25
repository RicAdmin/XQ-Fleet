import { Outlet, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { ErrorPanel } from '#/components/ui/ErrorPanel'
import { useForceLightTheme } from '#/lib/theme-mode'
import { requireAdminAccess } from '#/lib/route-guards'

import '#/styles/admin-ui.css'

function AdminRoot({ children }: { children: ReactNode }) {
  useForceLightTheme()
  return <div className="cxq-dashboard-root admin-shell">{children}</div>
}

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => requireAdminAccess(),
  component: () => (
    <AdminRoot>
      <Outlet />
    </AdminRoot>
  ),
  errorComponent: ({ error, reset }) => (
    <AdminRoot>
      <ErrorPanel
        title="Something went wrong in the admin area"
        message={error instanceof Error ? error.message : 'An unexpected error occurred.'}
        onRetry={reset}
      />
    </AdminRoot>
  ),
})
