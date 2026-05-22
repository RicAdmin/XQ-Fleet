import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'

import { LocaleHtmlLang } from '#/components/i18n/LocaleHtmlLang'
import { I18nProvider } from '#/i18n/context'
import { isLocale } from '#/i18n/locales'

export const Route = createFileRoute('/$locale')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) {
      throw notFound()
    }
    return { locale: params.locale }
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useRouteContext()
  return (
    <I18nProvider locale={locale}>
      <LocaleHtmlLang />
      <Outlet />
    </I18nProvider>
  )
}
