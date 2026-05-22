import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'

import { enLandingContent, type LandingContent } from '#/i18n/content/en'
import { msLandingContent } from '#/i18n/content/ms'
import { zhLandingContent } from '#/i18n/content/zh'

const byLocale: Record<Locale, LandingContent> = {
  en: enLandingContent,
  ms: msLandingContent,
  zh: zhLandingContent,
}

export function getLandingContent(locale: Locale): LandingContent {
  return byLocale[locale] ?? byLocale[DEFAULT_LOCALE]
}

export type { LandingContent }
