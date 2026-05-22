import type { LegalSection } from '#/lib/legal/types'

export function h2(text: string): LegalSection {
  return { type: 'h2', text }
}

export function h3(text: string): LegalSection {
  return { type: 'h3', text }
}

export function p(text: string): LegalSection {
  return { type: 'p', text }
}

export function ul(...items: string[]): LegalSection {
  return { type: 'ul', items }
}

export function table(headers: string[], rows: string[][]): LegalSection {
  return { type: 'table', headers, rows }
}

export function signature(...fields: string[]): LegalSection {
  return { type: 'signature', fields }
}
