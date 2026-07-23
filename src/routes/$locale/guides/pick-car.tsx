import { createFileRoute } from '@tanstack/react-router'

import { PickCarGuide } from '#/components/guides/pick-car-guide'
import type { Locale } from '#/i18n/locales'
import { seoMeta } from '#/lib/seo-locale-meta'

const title = 'Pick the Right Rental Car in Langkawi · Fleet Guide · XQ Car'
const description =
  'Compare economy, MPV, SUV, and OKU-friendly vehicles by luggage, passengers, and travel style for Langkawi roads.'

export const Route = createFileRoute('/$locale/guides/pick-car')({
  component: GuidesPickCarPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/guides/pick-car',
      title,
      description,
    }),
})

function GuidesPickCarPage() {
  return <PickCarGuide />
}
