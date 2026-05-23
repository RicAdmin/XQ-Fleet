import { createFileRoute } from '@tanstack/react-router'

import {
  ipay88ParamsFromBody,
  processIpay88Payment,
} from '#/lib/ipay88-process-payment'

export const Route = createFileRoute('/api/webhooks/ipay88')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text()
          const params = ipay88ParamsFromBody(body)
          const rawResponse = Object.fromEntries(params.entries())

          const result = await processIpay88Payment({
            merchantCode: params.get('MerchantCode') ?? '',
            paymentId: params.get('PaymentId') ?? '',
            refNo: params.get('RefNo') ?? '',
            amount: params.get('Amount') ?? '',
            currency: params.get('Currency') ?? 'MYR',
            status: params.get('Status') ?? '',
            transId: params.get('TransId') ?? '',
            authCode: params.get('AuthCode') ?? '',
            receivedSignature: params.get('Signature') ?? '',
            rawResponse,
            source: 'callback',
            localeHint: params.get('Xfield1'),
          })

          if (!result.ok) {
            if (result.reason === 'payment_not_found') {
              return new Response('Payment not found', { status: 404 })
            }
            if (result.reason === 'amount_mismatch') {
              return new Response('Amount mismatch', { status: 400 })
            }
            return new Response(
              result.reason === 'invalid_signature' ? 'Invalid signature' : 'Invalid merchant',
              { status: 400 },
            )
          }

          return new Response('RECEIVEOK', { status: 200 })
        } catch (err) {
          console.error('[iPay88 webhook]', err)
          return new Response('Internal error', { status: 500 })
        }
      },
    },
  },
})
