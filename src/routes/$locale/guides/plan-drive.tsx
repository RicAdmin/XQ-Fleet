import { createFileRoute } from '@tanstack/react-router'

import { PlanDriveGuide } from '#/components/guides/plan-drive-guide'
import { publicSitePath } from '#/lib/brand'
import { socialImageMeta } from '#/lib/seo-meta'

const title = 'Plan Your Langkawi Drive · Attractions & Routes · Car XQ'
const description =
  'Build your Langkawi itinerary by car: distances, drive times, and attraction combos for every day of your rental.'

export const Route = createFileRoute('/$locale/guides/plan-drive')({
  component: GuidesPlanDrivePage,
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: publicSitePath('/guides/plan-drive') },
      ...socialImageMeta(),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/guides/plan-drive') }],
  }),
})

function GuidesPlanDrivePage() {
  return <PlanDriveGuide />
}
