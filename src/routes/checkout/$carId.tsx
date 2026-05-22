import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirectWithParams } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/checkout/$carId')({
  beforeLoad: ({ params }) => legacyLocaleRedirectWithParams('/checkout/$carId', params),
})
