import type { Locale } from '#/i18n/locales'
import { enMessages } from '#/i18n/messages/en'
import { msMessages } from '#/i18n/messages/ms'
import { zhMessages } from '#/i18n/messages/zh'

export type AppMessages = typeof enMessages

export const messages: Record<Locale, AppMessages> = {
  en: enMessages,
  ms: msMessages,
  zh: zhMessages,
}

export { enMessages, msMessages, zhMessages }
