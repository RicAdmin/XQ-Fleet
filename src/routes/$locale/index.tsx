import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { HomeStructuredData } from '#/components/seo/HomeStructuredData'
import type { Locale } from '#/i18n/locales'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'
import { homeSeoMeta } from '#/lib/seo-locale-meta'

const indexSearchSchema = z.object({
  model: z.string().optional(),
})

export const Route = createFileRoute('/$locale/')({
  validateSearch: indexSearchSchema,
  head: ({ params }) => homeSeoMeta(params.locale as Locale),
  beforeLoad: async () => {
    const cars = await getPublicCars()
    return { cars }
  },
  component: LandingPage,
})

function LandingPage() {
  const { cars } = Route.useRouteContext() as { cars: PublicCarRow[] }
  const { model } = Route.useSearch()
  return (
    <>
      <HomeStructuredData />
      <CxqLandingPage initialCars={cars} initialModelQuery={model ?? ''} />
    </>
  )
}
