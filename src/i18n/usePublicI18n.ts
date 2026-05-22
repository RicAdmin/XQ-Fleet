import { defaultLocalePath } from '#/i18n/link'
import { useOptionalI18n } from '#/i18n/context'
import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'
import { translate } from '#/i18n/translate'

export function usePublicI18n() {
  const ctx = useOptionalI18n()
  const locale: Locale = ctx?.locale ?? DEFAULT_LOCALE
  const t = ctx?.t ?? ((key: string, vars?: Record<string, string | number>) => translate(DEFAULT_LOCALE, key, vars))
  const href = ctx?.localeHref ?? ((path: string) => defaultLocalePath(path))
  return { locale, t, href, hasLocale: Boolean(ctx) }
}
