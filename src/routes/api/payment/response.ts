import { createFileRoute } from '@tanstack/react-router'

import { publicSitePath } from '#/lib/brand'
import { logIpay88Error } from '#/lib/ipay88-log'
import {
  ipay88ParamsFromBody,
  ipay88PaymentReturnUrl,
  processIpay88Payment,
} from '#/lib/ipay88-process-payment'

async function handleIpay88BrowserReturn(request: Request): Promise<Response> {
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
      source: 'response',
      localeHint: params.get('Xfield1'),
    })

    if (!result.ok) {
      return Response.redirect(
        result.rentalId
          ? ipay88PaymentReturnUrl({
              rentalId: result.rentalId,
              locale: result.locale,
              guestCheckout: result.guestCheckout,
              payment: 'error',
            })
          : publicSitePath('/en'),
        302,
      )
    }

    const paymentFlag = result.outcome === 'failed' ? 'error' : 'response'

    return Response.redirect(
      ipay88PaymentReturnUrl({
        rentalId: result.rentalId,
        locale: result.locale,
        guestCheckout: result.guestCheckout,
        payment: paymentFlag,
      }),
      302,
    )
  } catch (err) {
    logIpay88Error('browser return handler threw', err)
    return Response.redirect(publicSitePath('/en'), 302)
  }
}

export const Route = createFileRoute('/api/payment/response')({
  server: {
    handlers: {
      POST: ({ request }) => handleIpay88BrowserReturn(request),
    },
  },
})
