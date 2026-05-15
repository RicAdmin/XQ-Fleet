import { createFileRoute } from '@tanstack/react-router'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const cars = await getPublicCars()
    return { cars }
  },
  component: LandingPage,
})

function LandingPage() {
  const { cars } = Route.useRouteContext() as { cars: PublicCarRow[] }
  return <CxqLandingPage initialCars={cars} />
}
