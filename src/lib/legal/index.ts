import { pdpaDocument } from '#/lib/legal/pdpa'
import { privacyDocument } from '#/lib/legal/privacy'
import { refundPolicyDocument } from '#/lib/legal/refund-policy'
import { rentalAgreementDocument } from '#/lib/legal/rental-agreement'
import { termsDocument } from '#/lib/legal/terms'
import type { LegalDocument, LegalDocumentSlug } from '#/lib/legal/types'

export const LEGAL_DOCUMENTS: Record<LegalDocumentSlug, LegalDocument> = {
  terms: termsDocument,
  'rental-agreement': rentalAgreementDocument,
  privacy: privacyDocument,
  'refund-policy': refundPolicyDocument,
  pdpa: pdpaDocument,
}

export const LEGAL_NAV_LINKS = [
  { slug: 'terms' as const, path: '/terms' as const, label: 'Terms & Conditions' },
  { slug: 'rental-agreement' as const, path: '/rental-agreement' as const, label: 'Rental Contract' },
  { slug: 'privacy' as const, path: '/privacy' as const, label: 'Privacy Policy' },
  { slug: 'refund-policy' as const, path: '/refund-policy' as const, label: 'Refund Policy' },
  { slug: 'pdpa' as const, path: '/pdpa' as const, label: 'PDPA Notice' },
]

export function getLegalDocument(slug: LegalDocumentSlug): LegalDocument {
  return LEGAL_DOCUMENTS[slug]
}

export * from '#/lib/legal/types'
export * from '#/lib/legal/company'
