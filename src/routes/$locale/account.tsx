import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

/** Legacy/fixed paths like /en/account from old verification emails. */
export const Route = createFileRoute('/$locale/account')({
  validateSearch: z.object({
    error: z.string().optional(),
    returnTo: z.string().optional(),
  }),
  beforeLoad: ({ params, search }) => {
    if (search.error) {
      throw redirect({
        to: '/$locale/login',
        params: { locale: params.locale },
        search: { error: search.error, returnTo: '/account' },
      })
    }

    throw redirect({ to: '/account' })
  },
})
