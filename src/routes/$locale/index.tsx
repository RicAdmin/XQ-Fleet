import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { WebMcpTools } from '#/components/landing/WebMcpTools'
import { HERO_BG, HERO_BG_768 } from '#/components/landing/cxq-landing-data'
import { HomeStructuredData } from '#/components/seo/HomeStructuredData'
import {
  acceptsMarkdown,
  agentDiscoveryLinkHeader,
  buildHomepageMarkdown,
  markdownNegotiationResponse,
} from '#/lib/agent-discovery'
import type { Locale } from '#/i18n/locales'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'
import type { SeasonRange } from '#/lib/pricing-logic'
import { homeSeoMeta } from '#/lib/seo-locale-meta'

const indexSearchSchema = z.object({
  model: z.string().optional(),
})

export const Route = createFileRoute('/$locale/')({
  validateSearch: indexSearchSchema,
  server: {
    handlers: {
      GET: async ({ request, next }) => {
        if (acceptsMarkdown(request)) {
          return markdownNegotiationResponse(buildHomepageMarkdown(), {
            Link: agentDiscoveryLinkHeader(),
          })
        }
        return next()
      },
    },
  },
  head: ({ params }) => {
    const seo = homeSeoMeta(params.locale as Locale)
    return {
      ...seo,
      links: [
        ...(seo.links ?? []),
        {
          rel: 'preload',
          as: 'image',
          href: HERO_BG_768,
          fetchPriority: 'high',
          media: '(max-width: 768px)',
        },
        {
          rel: 'preload',
          as: 'image',
          href: HERO_BG,
          fetchPriority: 'high',
          media: '(min-width: 769px)',
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
      <WebMcpTools />
      <CxqLandingPage
        initialCars={cars}
        initialSeasonCalendar={seasonCalendar}
        initialModelQuery={model ?? ''}
      />
    </>
  )
}
