import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'

const indexSearchSchema = z.object({
  model: z.string().optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: indexSearchSchema,
  beforeLoad: async () => {
    const cars = await getPublicCars()
    return { cars }
  },
  component: LandingPage,
})

function LandingPage() {
  const { cars } = Route.useRouteContext() as { cars: PublicCarRow[] }
  const { model } = Route.useSearch()
  return <CxqLandingPage initialCars={cars} initialModelQuery={model ?? ''} />
}
