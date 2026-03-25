import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireSurfaceAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => requireSurfaceAccess('account'),
  component: CustomerAccountLayout,
})

function CustomerAccountLayout() {
  return <Outlet />
}
