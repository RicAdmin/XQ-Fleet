import { createFileRoute } from '@tanstack/react-router'

import { KnowHowGuide } from '#/components/guides/know-how-guide'
import { publicSitePath } from '#/lib/brand'
import { socialImageMeta } from '#/lib/seo-meta'

const title = 'Driving Know-How in Langkawi · Parking, Fines & Fuel · Car XQ'
const description =
  'Langkawi parking rules, AES speed cameras, fuel stations, and what to do after an accident. Local know-how for first-time renters.'

export const Route = createFileRoute('/guides/know-how')({
  component: GuidesKnowHowPage,
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: publicSitePath('/guides/know-how') },
      ...socialImageMeta(),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/guides/know-how') }],
  }),
})

function GuidesKnowHowPage() {
  return <KnowHowGuide />
}
