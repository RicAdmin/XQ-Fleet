import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { loadLegalDocument } from '#/lib/legal'
import type { LegalDocument } from '#/lib/legal/types'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

export const Route = createFileRoute('/$locale/rental-agreement')({
  loader: async () => ({ document: await loadLegalDocument('rental-agreement') }),
  component: RentalAgreementPage,
  head: ({ loaderData, params }) => {
    const document = loaderData?.document as LegalDocument | undefined
    return seoMeta({
      locale: params.locale as Locale,
      path: '/rental-agreement',
      title: document?.metaTitle ?? 'Vehicle Rental Contract | XQ Car Rental Langkawi',
      description:
        document?.metaDescription ??
        'Vehicle rental contract for XQ Car Rental in Langkawi.',
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    })
  },
})

function RentalAgreementPage() {
  const { document } = Route.useLoaderData()
  return <LegalDocumentPage document={document} />
}
