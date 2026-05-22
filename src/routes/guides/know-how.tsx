import { createFileRoute } from '@tanstack/react-router'

import { legacyLocaleRedirect } from '#/lib/i18n-legacy-redirect'

export const Route = createFileRoute('/guides/know-how')({
  beforeLoad: () => legacyLocaleRedirect('/guides/know-how'),
})
