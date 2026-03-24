import { createFileRoute } from '@tanstack/react-router'

import CustomerHubShell from '#/components/shells/CustomerHubShell'
import { requireSurfaceAccess } from '#/lib/route-guards'

export const Route = createFileRoute('/account')({
  beforeLoad: async () => requireSurfaceAccess('account'),
  component: CustomerAccountPage,
})

function CustomerAccountPage() {
  const { session } = Route.useRouteContext()
  return <CustomerHubShell user={session.user} />
}
