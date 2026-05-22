import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { CxqLandingPage } from '#/components/landing/CxqLandingPage'
import { HomeStructuredData } from '#/components/seo/HomeStructuredData'
import { getPublicCars, type PublicCarRow } from '#/lib/portal-functions'
import { homeCanonicalUrl } from '#/lib/seo-home-schema'
import { socialImageMeta } from '#/lib/seo-meta'

const indexSearchSchema = z.object({
  model: z.string().optional(),
})

export const Route = createFileRoute('/')({
  validateSearch: indexSearchSchema,
  head: () => ({
    meta: [
      {
        title: 'Car Rental in Langkawi | Book Online · Car XQ',
      },
      {
        name: 'description',
        content:
          'Rent a car in Langkawi from RM 70/day. Free delivery to Langkawi Airport, the ferry jetty, or your hotel. Family-owned since 2015 · 4.9★ rated · book in 90 seconds.',
      },
      {
        property: 'og:title',
        content: 'Car Rental in Langkawi | Car XQ',
      },
      {
        property: 'og:description',
        content:
          'Affordable Langkawi car rental from RM 70/day — free airport delivery, 4.9★ on Google, family-owned since 2015. Economy, MPV & SUV fleet. Book in 90 seconds.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: homeCanonicalUrl(),
      },
      {
        property: 'og:locale',
        content: 'en_MY',
      },
      ...socialImageMeta(),
    ],
    links: [
      {
        rel: 'canonical',
        href: homeCanonicalUrl(),
      },
    ],
  }),
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
