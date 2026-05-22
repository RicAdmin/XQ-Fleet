export type LegalSection =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'signature'; fields: string[] }

export type LegalDocumentSlug =
  | 'terms'
  | 'rental-agreement'
  | 'privacy'
  | 'refund-policy'
  | 'pdpa'

export type LegalLocaleContent = {
  code: string
  label: string
  title: string
  documentLabel: string
  sections: LegalSection[]
  companyIntro?: readonly string[]
  footerText?: string
}

export type LegalDocument = {
  slug: LegalDocumentSlug
  path: `/${string}`
  title: string
  metaTitle: string
  metaDescription: string
  effectiveDate: string
  version: string
  documentLabel: string
  sections: LegalSection[]
  locales?: LegalLocaleContent[]
}
