import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirect } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/guides/pick-car')({
  beforeLoad: () => legacyLocaleRedirect('/guides/pick-car'),
})
