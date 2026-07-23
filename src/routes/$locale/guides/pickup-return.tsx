import { createFileRoute } from '@tanstack/react-router'

import { PickupReturnGuide } from '#/components/guides/pickup-return-guide'
import type { Locale } from '#/i18n/locales'
import { seoMeta } from '#/lib/seo-locale-meta'

const title = 'Car Pickup & Return Guide · Langkawi Airport & Jetty · XQ Car'
const description =
  'Step-by-step pickup at LGK Door 3 or Kuah Ferry Jetty. What to bring, walk-through process, and fuel return rules for Langkawi car rental.'

export const Route = createFileRoute('/$locale/guides/pickup-return')({
  component: GuidesPickupReturnPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/guides/pickup-return',
      title,
      description,
    }),
})

function GuidesPickupReturnPage() {
  return <PickupReturnGuide />
}
