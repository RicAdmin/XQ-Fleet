import { createFileRoute } from '@tanstack/react-router'

import { PlanDriveGuide } from '#/components/guides/plan-drive-guide'
import type { Locale } from '#/i18n/locales'
import { seoMeta } from '#/lib/seo-locale-meta'

const title = 'Plan Your Langkawi Drive · Attractions & Routes · XQ Car'
const description =
  'Build your Langkawi itinerary by car: distances, drive times, and attraction combos for every day of your rental.'

export const Route = createFileRoute('/$locale/guides/plan-drive')({
  component: GuidesPlanDrivePage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/guides/plan-drive',
      title,
      description,
    }),
})

function GuidesPlanDrivePage() {
  return <PlanDriveGuide />
}
