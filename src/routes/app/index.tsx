import { createFileRoute } from '@tanstack/react-router'

import StaffHubShell from '#/components/shells/StaffHubShell'

export const Route = createFileRoute('/app/')({
  component: StaffAppPage,
})

function StaffAppPage() {
  const { session } = Route.useRouteContext() as unknown as {
    session: { user: { name: string; email: string; role: string } }
  }
  return <StaffHubShell user={session.user} />
}
