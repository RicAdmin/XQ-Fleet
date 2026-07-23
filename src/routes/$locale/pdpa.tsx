import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { getLegalDocument } from '#/lib/legal'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

const document = getLegalDocument('pdpa')

export const Route = createFileRoute('/$locale/pdpa')({
  component: PdpaPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/pdpa',
      title: document.metaTitle,
      description: document.metaDescription,
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    }),
})

function PdpaPage() {
  return <LegalDocumentPage document={document} />
}
