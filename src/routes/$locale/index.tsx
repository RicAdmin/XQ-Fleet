import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import {
  HERO_BG_768_AVIF,
  HERO_BG_1280_AVIF,
} from '#/components/landing/cxq-landing-data'
import { HomeStructuredData } from '#/components/seo/HomeStructuredData'
import {
  acceptsMarkdown,
  agentDiscoveryLinkHeader,
  buildHomepageMarkdown,
  deferWithAgentDiscoveryLinkHeader,
  markdownNegotiationResponse,
} from '#/lib/agent-discovery'
import type { Locale } from '#/i18n/locales'
import {
  getPublicCarsForHomepage,
  getPublicSeasonCalendar,
  type PublicCarRow,
} from '#/lib/portal-functions'
import type { SeasonRange } from '#/lib/pricing-logic'
import { homeSeoMeta } from '#/lib/seo-locale-meta'

const WebMcpToolsLazy = lazy(() =>
  import('#/components/landing/WebMcpTools').then((m) => ({ default: m.WebMcpTools })),
)

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
        return deferWithAgentDiscoveryLinkHeader(next)
      },
    },
  },
  head: ({ params }) => {
    const seo = homeSeoMeta(params.locale as Locale)
    return {
      ...seo,
      links: [
        ...(seo.links ?? []),
        // Single preferred-format preload per viewport — avoids multi-format duplicate fetches.
        {
          rel: 'preload',
          as: 'image',
          type: 'image/avif',
          href: HERO_BG_768_AVIF,
          fetchPriority: 'high',
          media: '(max-width: 768px)',
        },
        {
          rel: 'preload',
          as: 'image',
          type: 'image/avif',
          href: HERO_BG_1280_AVIF,
          fetchPriority: 'high',
          media: '(min-width: 769px)',
        },
      ],
    }
  },
  beforeLoad: async () => {
    const [cars, seasonCalendar] = await Promise.all([
      getPublicCarsForHomepage(),
      getPublicSeasonCalendar(),
    ])
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
      <Suspense fallback={null}>
        <WebMcpToolsLazy />
      </Suspense>
      <CxqLandingPage
        initialCars={cars}
        initialSeasonCalendar={seasonCalendar}
        initialModelQuery={model ?? ''}
      />
    </>
  )
}
