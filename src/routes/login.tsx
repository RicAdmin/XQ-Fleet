import { createFileRoute, redirect } from '@tanstack/react-router'

import { defaultLocalePath } from '#/i18n/link'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    throw redirect({ to: defaultLocalePath('/login') as never })
  },
})
