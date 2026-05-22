import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/blog/$slug')({
  beforeLoad: ({ params }) => legacyLocaleRedirectWithParams('/blog/$slug', params),
})
