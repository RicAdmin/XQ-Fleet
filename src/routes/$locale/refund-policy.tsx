import { createFileRoute } from '@tanstack/react-router'

import { LegalDocumentPage } from '#/components/legal/LegalDocumentPage'
import type { Locale } from '#/i18n/locales'
import { loadLegalDocument } from '#/lib/legal'
import type { LegalDocument } from '#/lib/legal/types'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_LOGO } from '#/lib/seo-meta'

export const Route = createFileRoute('/$locale/refund-policy')({
  loader: async () => ({ document: await loadLegalDocument('refund-policy') }),
  component: RefundPolicyPage,
  head: ({ loaderData, params }) => {
    const document = loaderData?.document as LegalDocument | undefined
    return seoMeta({
      locale: params.locale as Locale,
      path: '/refund-policy',
      title: document?.metaTitle ?? 'Cancellation & Refund Policy | XQ Car Rental Langkawi',
      description:
        document?.metaDescription ??
        'Cancellation and refund terms for XQ Car Rental bookings in Langkawi.',
      imagePath: SEO_OG_LOGO,
      card: 'summary',
    })
  },
})

function RefundPolicyPage() {
  const { document } = Route.useLoaderData()
  return <LegalDocumentPage document={document} />
}
