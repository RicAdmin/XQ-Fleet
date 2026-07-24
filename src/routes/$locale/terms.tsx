import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { loadLegalDocument } from '#/lib/legal'
import type { LegalDocument } from '#/lib/legal/types'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

export const Route = createFileRoute('/$locale/terms')({
  loader: async () => ({ document: await loadLegalDocument('terms') }),
  component: TermsPage,
  head: ({ loaderData, params }) => {
    const document = loaderData?.document as LegalDocument | undefined
    return seoMeta({
      locale: params.locale as Locale,
      path: '/terms',
      title: document?.metaTitle ?? 'Terms & Conditions | XQ Car Rental Langkawi',
      description:
        document?.metaDescription ??
        'Website terms and conditions for XQ Car Rental in Langkawi, Malaysia.',
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    })
  },
})

function TermsPage() {
  const { document } = Route.useLoaderData()
  return <LegalDocumentPage document={document} />
}
