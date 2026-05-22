import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import { getLegalDocument } from '#/lib/legal'
import { publicSitePath } from '#/lib/brand'
import { SEO_OG_LOGO, socialImageMeta } from '#/lib/seo-meta'

const document = getLegalDocument('pdpa')

export const Route = createFileRoute('/pdpa')({
  component: PdpaPage,
  head: () => ({
    meta: [
      { title: document.metaTitle },
      { name: 'description', content: document.metaDescription },
      { property: 'og:title', content: document.metaTitle },
      { property: 'og:description', content: document.metaDescription },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: publicSitePath('/pdpa') },
      ...socialImageMeta(SEO_OG_LOGO, 'summary'),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/pdpa') }],
  }),
})

function PdpaPage() {
  return <LegalDocumentPage document={document} />
}
