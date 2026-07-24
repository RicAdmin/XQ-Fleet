import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'

import { LocaleHtmlLang } from '#/components/i18n/LocaleHtmlLang'
import { I18nProvider } from '#/i18n/context'
import {
  loadLandingContent,
  primeLandingContent,
  type LandingContent,
} from '#/i18n/content'
import { isLocale, type Locale } from '#/i18n/locales'
import { loadMessages, primeMessages, type AppMessages } from '#/i18n/messages'
import { LandingContentProvider } from '#/i18n/useLandingContent'

export const Route = createFileRoute('/$locale')({
  beforeLoad: async ({ params }) => {
    if (!isLocale(params.locale)) {
      throw notFound()
    }
    const [landingContent, localeMessages] = await Promise.all([
      loadLandingContent(params.locale),
      loadMessages(params.locale),
    ])
    // Warm server-side module caches for sync helpers (getLandingContent, messages proxy).
    primeLandingContent(params.locale, landingContent)
    primeMessages(params.locale, localeMessages)
    return { locale: params.locale, landingContent, localeMessages }
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale, landingContent, localeMessages } = Route.useRouteContext() as {
    locale: Locale
    landingContent: LandingContent
    localeMessages: AppMessages
  }
  // Rehydrate module caches from dehydrated beforeLoad data on the client.
  primeLandingContent(locale, landingContent)
  primeMessages(locale, localeMessages)
  return (
    <I18nProvider locale={locale}>
      <LandingContentProvider content={landingContent}>
        <LocaleHtmlLang />
        <Outlet />
      </LandingContentProvider>
    </I18nProvider>
  )
}
