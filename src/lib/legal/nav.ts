import type { LegalDocumentSlug } from '#/lib/legal/types'

export const LEGAL_NAV_LINKS = [
  { slug: 'terms' as const, path: '/terms' as const, label: 'Terms & Conditions' },
  { slug: 'rental-agreement' as const, path: '/rental-agreement' as const, label: 'Rental Contract' },
  { slug: 'privacy' as const, path: '/privacy' as const, label: 'Privacy Policy' },
  { slug: 'refund-policy' as const, path: '/refund-policy' as const, label: 'Refund Policy' },
  { slug: 'pdpa' as const, path: '/pdpa' as const, label: 'PDPA Notice' },
]

export type LegalNavLink = (typeof LEGAL_NAV_LINKS)[number]

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return LEGAL_NAV_LINKS.some((link) => link.slug === value)
}
