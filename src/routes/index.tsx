import { createFileRoute, redirect } from '@tanstack/react-router'

import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, negotiateLocale, parseLocale } from '#/i18n/locales'
import { localePath } from '#/i18n/link'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    let locale = DEFAULT_LOCALE

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
        locale = parseLocale(stored ?? undefined)
      } catch {
        locale = DEFAULT_LOCALE
      }
    } else if (typeof navigator !== 'undefined') {
      locale = negotiateLocale(navigator.language)
    }

    throw redirect({ to: localePath(locale, '/') as '/$locale/' })
  },
})
