/**
 * Server-side conversion webhook for the Langkawi_Preference affiliate
 * backend. Fire-and-forget: never throws, never awaited on the response
 * path, so a tracking outage can never break checkout.
 */

export type ReportConversionInput = {
  refCode: string | null
  bookingReference: string
  amountCents: number // minor units (sen) — do not divide by 100
  currency: string
  customerEmail: string
  customerName: string
}

export async function reportConversion(order: ReportConversionInput): Promise<void> {
  if (!order.refCode) return
  const baseUrl = process.env.AFFILIATE_TRACKING_BASE_URL
  const apiKey = process.env.AFFILIATE_TRACKING_PUBLIC_KEY
  if (!baseUrl || !apiKey) return

  try {
    await fetch(`${baseUrl.replace(/\/$/, '')}/api/webhook/conversion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify({
        event_type: 'PURCHASE',
        referral_code: order.refCode,
        amount_cents: order.amountCents,
        currency: order.currency,
        customer_email: order.customerEmail,
        customer_name: order.customerName,
        event_metadata: { orderId: order.bookingReference },
      }),
    })
  } catch (err) {
    console.error('[affiliate-tracking] reportConversion failed:', err)
  }
}
