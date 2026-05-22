import { createFileRoute } from '@tanstack/react-router'

import { PickCarGuide } from '#/components/guides/pick-car-guide'
import { publicSitePath } from '#/lib/brand'
import { socialImageMeta } from '#/lib/seo-meta'

const title = 'Pick the Right Rental Car in Langkawi · Fleet Guide · Car XQ'
const description =
  'Compare economy, MPV, SUV, and OKU-friendly vehicles by luggage, passengers, and travel style for Langkawi roads.'

export const Route = createFileRoute('/$locale/guides/pick-car')({
  component: GuidesPickCarPage,
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: publicSitePath('/guides/pick-car') },
      ...socialImageMeta(),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/guides/pick-car') }],
  }),
})

function GuidesPickCarPage() {
  return <PickCarGuide />
}
