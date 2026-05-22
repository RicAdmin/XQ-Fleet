import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'

import { usePublicI18n } from '#/i18n/usePublicI18n'
import { getRequestSession } from '#/lib/auth-functions'
import { initiatePayment } from '#/lib/payment-functions'

export const Route = createFileRoute('/$locale/pay/$rentalId')({
  loader: async ({ params }) => {
    try {
      const result = await initiatePayment({ data: { rentalId: params.rentalId } })
      return { formParams: result.formParams, error: null }
    } catch (err) {
      const session = await getRequestSession()
      if (session) {
        throw redirect({
          to: '/account/bookings/$rentalId',
          params: { rentalId: params.rentalId },
          search: { payment: 'error' },
        })
      }
      throw redirect({
        to: '/checkout/confirmed/$rentalId',
        params: { rentalId: params.rentalId },
        search: { payment: 'error' },
      })
    }
  },
  component: PaymentRedirectPage,
})

function PaymentRedirectPage() {
  const { formParams } = Route.useLoaderData()
  const { t } = usePublicI18n()

  useEffect(() => {
    const form = document.getElementById('ipay88-form') as HTMLFormElement | null
    if (form) form.submit()
  }, [])

  return (
    <div className="payment-redirect-page">
      <div className="payment-redirect-content">
        <div className="payment-redirect-spinner" />
        <p className="payment-redirect-text">{t('payment.redirecting')}</p>
        <p className="payment-redirect-sub">{t('payment.doNotClose')}</p>
      </div>

      <form
        id="ipay88-form"
        method="POST"
        action={formParams.gatewayUrl}
        style={{ display: 'none' }}
      >
        <input type="hidden" name="MerchantCode" value={formParams.MerchantCode} />
        <input type="hidden" name="PaymentId" value={formParams.PaymentId} />
        <input type="hidden" name="RefNo" value={formParams.RefNo} />
        <input type="hidden" name="Amount" value={formParams.Amount} />
        <input type="hidden" name="Currency" value={formParams.Currency} />
        <input type="hidden" name="ProdDesc" value={formParams.ProdDesc} />
        <input type="hidden" name="UserName" value={formParams.UserName} />
        <input type="hidden" name="UserEmail" value={formParams.UserEmail} />
        <input type="hidden" name="UserContact" value={formParams.UserContact} />
        <input type="hidden" name="Remark" value={formParams.Remark} />
        <input type="hidden" name="Lang" value={formParams.Lang} />
        <input type="hidden" name="SignatureType" value={formParams.SignatureType} />
        <input type="hidden" name="Signature" value={formParams.Signature} />
        <input type="hidden" name="ResponseURL" value={formParams.ResponseURL} />
        <input type="hidden" name="BackendURL" value={formParams.BackendURL} />
      </form>
    </div>
  )
}
