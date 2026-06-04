import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { HomeStructuredData } from '#/components/seo/HomeStructuredData'
import type { Locale } from '#/i18n/locales'
import { getPublicCars, getPublicSeasonCalendar, type PublicCarRow } from '#/lib/portal-functions'
import type { SeasonRange } from '#/lib/pricing-logic'
import { homeSeoMeta } from '#/lib/seo-locale-meta'

const indexSearchSchema = z.object({
  model: z.string().optional(),
})

export const Route = createFileRoute('/$locale/')({
  validateSearch: indexSearchSchema,
  head: ({ params }) => homeSeoMeta(params.locale as Locale),
  beforeLoad: async () => {
    const [cars, seasonCalendar] = await Promise.all([getPublicCars(), getPublicSeasonCalendar()])
    return { cars, seasonCalendar }
  },
  component: LandingPage,
})

function LandingPage() {
  const { cars, seasonCalendar } = Route.useRouteContext() as {
    cars: PublicCarRow[]
    seasonCalendar: SeasonRange[]
  }
  const { model } = Route.useSearch()
  return (
    <>
      <HomeStructuredData />
      <CxqLandingPage
        initialCars={cars}
        initialSeasonCalendar={seasonCalendar}
        initialModelQuery={model ?? ''}
      />
    </>
  )
}
