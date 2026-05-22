import { createFileRoute } from '@tanstack/react-router'

import { AboutPage } from '#/components/about/AboutPage'
import type { Locale } from '#/i18n/locales'
import { aboutSeoMeta } from '#/lib/seo-locale-meta'

export const Route = createFileRoute('/$locale/about')({
  component: AboutPage,
  head: ({ params }) => aboutSeoMeta(params.locale as Locale),
})
