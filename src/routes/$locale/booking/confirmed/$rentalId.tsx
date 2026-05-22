import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

/** Legacy guest return URL — iPay88 may still redirect here from older payment sessions. */
export const Route = createFileRoute('/$locale/booking/confirmed/$rentalId')({
  validateSearch: z.object({
    payment: z.enum(['response', 'error']).optional(),
  }),
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: '/checkout/confirmed/$rentalId',
      params: { rentalId: params.rentalId },
      search,
    })
  },
})
