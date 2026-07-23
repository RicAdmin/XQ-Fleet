import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { getLegalDocument } from '#/lib/legal'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

const document = getLegalDocument('terms')

export const Route = createFileRoute('/$locale/terms')({
  component: TermsPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/terms',
      title: document.metaTitle,
      description: document.metaDescription,
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    }),
})

function TermsPage() {
  return <LegalDocumentPage document={document} />
}
