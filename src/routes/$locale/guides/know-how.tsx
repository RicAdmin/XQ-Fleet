import { createFileRoute } from '@tanstack/react-router'

import { KnowHowGuide } from '#/components/guides/know-how-guide'
import type { Locale } from '#/i18n/locales'
import { seoMeta } from '#/lib/seo-locale-meta'

const title = 'Driving Know-How in Langkawi · Parking, Fines & Fuel · XQ Car'
const description =
  'Langkawi parking rules, AES speed cameras, fuel stations, and what to do after an accident. Local know-how for first-time renters.'

export const Route = createFileRoute('/$locale/guides/know-how')({
  component: GuidesKnowHowPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/guides/know-how',
      title,
      description,
    }),
})

function GuidesKnowHowPage() {
  return <KnowHowGuide />
}
