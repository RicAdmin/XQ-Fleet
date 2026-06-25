import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { HERO_BG } from '#/components/landing/cxq-landing-data'
import { HomeStructuredData } from '#/components/seo/HomeStructuredData'
import type { Locale } from '#/i18n/locales'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'
import type { SeasonRange } from '#/lib/pricing-logic'
import { homeSeoMeta } from '#/lib/seo-locale-meta'

const indexSearchSchema = z.object({
  model: z.string().optional(),
})

export const Route = createFileRoute('/$locale/')({
  validateSearch: indexSearchSchema,
  head: ({ params }) => {
    const seo = homeSeoMeta(params.locale as Locale)
    return {
      ...seo,
      links: [
        ...(seo.links ?? []),
        {
          rel: 'preload',
          as: 'image',
          href: HERO_BG,
          fetchPriority: 'high',
        },
      ],
    }
  },
  beforeLoad: async () => {
    const cars = await getPublicCars()
    return { cars, seasonCalendar: [] as SeasonRange[] }
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
