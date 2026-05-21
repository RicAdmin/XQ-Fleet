import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'

import { getRequestSession } from '#/lib/auth-functions'
import { initiatePayment } from '#/lib/payment-functions'

export const Route = createFileRoute('/pay/$rentalId')({
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

  useEffect(() => {
    // Auto-submit the form after mount
    const form = document.getElementById('ipay88-form') as HTMLFormElement | null
    if (form) form.submit()
  }, [])

  return (
    <div className="payment-redirect-page">
      <div className="payment-redirect-content">
        <div className="payment-redirect-spinner" />
        <p className="payment-redirect-text">Redirecting to payment gateway…</p>
        <p className="payment-redirect-sub">Please do not close this page.</p>
      </div>

      {/* Hidden auto-submit form */}
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
