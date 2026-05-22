import { createFileRoute } from '@tanstack/react-router'

import { PickupReturnGuide } from '#/components/guides/pickup-return-guide'
import { publicSitePath } from '#/lib/brand'
import { socialImageMeta } from '#/lib/seo-meta'

const title = 'Car Pickup & Return Guide · Langkawi Airport & Jetty · Car XQ'
const description =
  'Step-by-step pickup at LGK Door 3 or Kuah Ferry Jetty. What to bring, walk-through process, and fuel return rules for Langkawi car rental.'

export const Route = createFileRoute('/$locale/guides/pickup-return')({
  component: GuidesPickupReturnPage,
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: publicSitePath('/guides/pickup-return') },
      ...socialImageMeta(),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/guides/pickup-return') }],
  }),
})

function GuidesPickupReturnPage() {
  return <PickupReturnGuide />
}
