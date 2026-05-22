import { Outlet, createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useForceLightTheme } from '#/lib/theme-mode'
import { requireSurfaceAccess } from '#/lib/route-guards'

function StaffAppRoot({ children }: { children: ReactNode }) {
  useForceLightTheme()
  return <div className="cxq-dashboard-root">{children}</div>
}

export const Route = createFileRoute('/app')({
  beforeLoad: async () => requireSurfaceAccess('app'),
  component: () => (
    <StaffAppRoot>
      <Outlet />
    </StaffAppRoot>
  ),
})
