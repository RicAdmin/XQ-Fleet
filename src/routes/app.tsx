import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireSurfaceAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/app')({
  beforeLoad: async () => requireSurfaceAccess('app'),
  component: () => <Outlet />,
})
