import { createFileRoute } from '@tanstack/react-router'

import StaffHubShell from '#/components/shells/StaffHubShell'
import { requireSurfaceAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/app')({
  beforeLoad: async () => requireSurfaceAccess('app'),
  component: StaffAppPage,
})

function StaffAppPage() {
  const { session } = Route.useRouteContext()
  return <StaffHubShell user={session.user} />
}
