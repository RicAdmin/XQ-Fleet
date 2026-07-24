import type { LegalDocument, LegalDocumentSlug } from '#/lib/legal/types'

export * from '#/lib/legal/types'
export * from '#/lib/legal/company'
export { LEGAL_NAV_LINKS, isLegalDocumentSlug } from '#/lib/legal/nav'

/** Load a single legal document without pulling every locale body into the shared graph. */
export async function loadLegalDocument(slug: LegalDocumentSlug): Promise<LegalDocument> {
  switch (slug) {
    case 'terms':
      return (await import('#/lib/legal/terms')).termsDocument
    case 'rental-agreement':
      return (await import('#/lib/legal/rental-agreement')).rentalAgreementDocument
    case 'privacy':
      return (await import('#/lib/legal/privacy')).privacyDocument
    case 'refund-policy':
      return (await import('#/lib/legal/refund-policy')).refundPolicyDocument
    case 'pdpa':
      return (await import('#/lib/legal/pdpa')).pdpaDocument
    default: {
      const _exhaustive: never = slug
      throw new Error(`Unknown legal document: ${_exhaustive}`)
    }
  }
}

/** @deprecated Prefer loadLegalDocument for route code-splitting. */
export function getLegalDocument(slug: LegalDocumentSlug): LegalDocument {
  throw new Error(
    `getLegalDocument('${slug}') is sync-removed for code splitting — use loadLegalDocument in beforeLoad`,
  )
}
