import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { loadLegalDocument } from '#/lib/legal'
import type { LegalDocument } from '#/lib/legal/types'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

export const Route = createFileRoute('/$locale/privacy')({
  loader: async () => ({ document: await loadLegalDocument('privacy') }),
  component: PrivacyPage,
  head: ({ loaderData, params }) => {
    const document = loaderData?.document as LegalDocument | undefined
    return seoMeta({
      locale: params.locale as Locale,
      path: '/privacy',
      title: document?.metaTitle ?? 'Privacy Policy | XQ Car Rental Langkawi',
      description:
        document?.metaDescription ??
        'How XQ Car Rental collects, uses, and protects your personal data.',
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    })
  },
})

function PrivacyPage() {
  const { document } = Route.useLoaderData()
  return <LegalDocumentPage document={document} />
}
