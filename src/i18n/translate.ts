import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'
import { messages } from '#/i18n/messages'

type MessageTree = Record<string, string | MessageTree>

function resolvePath(tree: MessageTree, key: string): string | undefined {
  const parts = key.split('.')
  let node: string | MessageTree | undefined = tree
  for (const part of parts) {
    if (typeof node !== 'object' || node === null) return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const primary = resolvePath(messages[locale] as MessageTree, key)
  const fallback =
    locale !== DEFAULT_LOCALE ? resolvePath(messages[DEFAULT_LOCALE] as MessageTree, key) : undefined
  let text = primary ?? fallback ?? key

  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }

  return text
}

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string
