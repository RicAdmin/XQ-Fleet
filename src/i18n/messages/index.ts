import type { Locale } from '#/i18n/locales'
import { enMessages } from '#/i18n/messages/en'

export type AppMessages = typeof enMessages

type MessageLoader = () => Promise<{ default?: AppMessages } & Record<string, AppMessages>>

const loaders: Record<Locale, MessageLoader> = {
  en: async () => ({ enMessages }),
  ms: () => import('#/i18n/messages/ms'),
  zh: () => import('#/i18n/messages/zh'),
}

const cache: Partial<Record<Locale, AppMessages>> = {
  en: enMessages,
}

/** Stable promises for React `use()` — one in-flight entry per locale. */
const inflight = new Map<Locale, Promise<AppMessages>>()

function resolveLocaleMessages(
  locale: Locale,
  mod: { default?: AppMessages } & Record<string, AppMessages>,
): AppMessages {
  if (locale === 'ms') return (mod as { msMessages: AppMessages }).msMessages
  if (locale === 'zh') return (mod as { zhMessages: AppMessages }).zhMessages
  return enMessages
}

/** Seed the sync cache from dehydrated route context (SSR → client hydration). */
export function primeMessages(locale: Locale, msgs: AppMessages): void {
  cache[locale] = msgs
  inflight.set(locale, Promise.resolve(msgs))
}

export function loadMessages(locale: Locale): Promise<AppMessages> {
  const hit = cache[locale]
  if (hit) {
    let settled = inflight.get(locale)
    if (!settled) {
      settled = Promise.resolve(hit)
      inflight.set(locale, settled)
    }
    return settled
  }

  const existing = inflight.get(locale)
  if (existing) return existing

  const pending = loaders[locale]().then((mod) => {
    const messages = resolveLocaleMessages(locale, mod)
    cache[locale] = messages
    return messages
  })
  inflight.set(locale, pending)
  return pending
}

/** Stable promise suitable for React `use()` (e.g. NotFound outside locale layout). */
export function ensureMessages(locale: Locale): Promise<AppMessages> {
  return loadMessages(locale)
}

/** Sync access after route beforeLoad / primeMessages has primed the locale (EN always available). */
export const messages: Record<Locale, AppMessages> = new Proxy({} as Record<Locale, AppMessages>, {
  get(_target, prop: string) {
    if (prop === 'en') return enMessages
    const locale = prop as Locale
    const hit = cache[locale]
    if (hit) return hit
    return enMessages
  },
})

export { enMessages }
