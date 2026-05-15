import { createFileRoute } from '@tanstack/react-router'

import { PickCarGuide } from '#/components/guides/pick-car-guide'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'

export const Route = createFileRoute('/guides/pick-car')({
  beforeLoad: async () => ({ cars: await getPublicCars() }),
  component: GuidesPickCarPage,
})

function GuidesPickCarPage() {
  const { cars } = Route.useRouteContext() as { cars: PublicCarRow[] }
  return <PickCarGuide cars={cars} />
}
