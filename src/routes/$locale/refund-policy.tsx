import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { getLegalDocument } from '#/lib/legal'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

const document = getLegalDocument('refund-policy')

export const Route = createFileRoute('/$locale/refund-policy')({
  component: RefundPolicyPage,
  head: ({ params }) =>
    seoMeta({
      locale: params.locale as Locale,
      path: '/refund-policy',
      title: document.metaTitle,
      description: document.metaDescription,
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    }),
})

function RefundPolicyPage() {
  return <LegalDocumentPage document={document} />
}
