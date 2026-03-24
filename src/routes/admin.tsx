import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireInternalAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => requireInternalAccess(),
  component: () => <Outlet />,
})
