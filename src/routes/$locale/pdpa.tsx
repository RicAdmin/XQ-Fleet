import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { loadLegalDocument } from '#/lib/legal'
import type { LegalDocument } from '#/lib/legal/types'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

export const Route = createFileRoute('/$locale/pdpa')({
  loader: async () => ({ document: await loadLegalDocument('pdpa') }),
  component: PdpaPage,
  head: ({ loaderData, params }) => {
    const document = loaderData?.document as LegalDocument | undefined
    return seoMeta({
      locale: params.locale as Locale,
      path: '/pdpa',
      title: document?.metaTitle ?? 'PDPA Notice | XQ Car Rental Langkawi',
      description:
        document?.metaDescription ??
        'Personal Data Protection Act notice for XQ Car Rental.',
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    })
  },
})

function PdpaPage() {
  const { document } = Route.useLoaderData()
  return <LegalDocumentPage document={document} />
}
