import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultLocalePath } from '#/i18n/link'

export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    throw redirect({ to: defaultLocalePath('/register') as never })
  },
})
