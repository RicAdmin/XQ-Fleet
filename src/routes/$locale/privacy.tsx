import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { getLegalDocument } from '#/lib/legal'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

const document = getLegalDocument('privacy')

export const Route = createFileRoute('/$locale/privacy')({
  component: PrivacyPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/privacy',
      title: document.metaTitle,
      description: document.metaDescription,
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    }),
})

function PrivacyPage() {
  return <LegalDocumentPage document={document} />
}
