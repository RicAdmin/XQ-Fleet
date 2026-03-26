import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/webhooks/ipay88')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text()
          const params = new URLSearchParams(body)

          const merchantCode = params.get('MerchantCode') ?? ''
          const paymentId = params.get('PaymentId') ?? ''
          const refNo = params.get('RefNo') ?? ''
          const amount = params.get('Amount') ?? ''
          const currency = params.get('Currency') ?? 'MYR'
          const status = params.get('Status') ?? ''
          const transId = params.get('TransId') ?? ''
          const errDesc = params.get('ErrDesc') ?? ''
          const receivedSignature = params.get('Signature') ?? ''

          const configuredMerchantCode = process.env.IPAY88_MERCHANT_CODE ?? ''
          const merchantKey = process.env.IPAY88_MERCHANT_KEY ?? ''

          // Reject if merchant code doesn't match
          if (merchantCode !== configuredMerchantCode) {
            return new Response('Invalid merchant', { status: 400 })
          }

          // Verify signature
          const { verifyResponseSignature } = await import('#/lib/payment-functions')
          const valid = verifyResponseSignature(
            merchantKey,
            merchantCode,
            paymentId,
            refNo,
            status,
            amount,
            currency,
            receivedSignature,
          )
          if (!valid) {
            return new Response('Invalid signature', { status: 400 })
          }

          // Look up payment record by RefNo (payment.id without hyphens)
          const { db } = await import('#/db')
          const { payments, rentals, cars } = await import('#/db/schema')
          const { eq, and } = await import('drizzle-orm')

          // Reconstruct UUID from refNo (32 hex chars → UUID format)
          const paymentUuid =
            refNo.length === 32
              ? `${refNo.slice(0, 8)}-${refNo.slice(8, 12)}-${refNo.slice(12, 16)}-${refNo.slice(16, 20)}-${refNo.slice(20)}`
              : refNo

          const [payment] = await db
            .select({
              id: payments.id,
              rentalId: payments.rentalId,
              status: payments.status,
              amountSen: payments.amountSen,
            })
            .from(payments)
            .where(eq(payments.id, paymentUuid))
            .limit(1)

          if (!payment) {
            return new Response('Payment not found', { status: 404 })
          }

          // Idempotency: already processed
          if (payment.status === 'successful' || payment.status === 'voided') {
            return new Response('RECEIVEOK', { status: 200 })
          }

          const isSuccess = status === '1'
          const respondedAt = new Date()

          if (isSuccess) {
            // Mark payment successful
            await db
              .update(payments)
              .set({
                status: 'successful',
                externalRef: transId,
                paymentMethod: paymentId,
                respondedAt,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id))

            // Update rental: paidAmountSen, paymentStatus='paid', status stays pending (confirmed by payment)
            const [rental] = await db
              .select({ id: rentals.id, carId: rentals.carId, totalAmountSen: rentals.totalAmountSen })
              .from(rentals)
              .where(eq(rentals.id, payment.rentalId))
              .limit(1)

            if (rental) {
              await db
                .update(rentals)
                .set({
                  paidAmountSen: payment.amountSen,
                  paymentStatus: 'paid',
                  updatedAt: new Date(),
                })
                .where(eq(rentals.id, rental.id))

              // Car transitions to reserved (confirmed booking)
              await db
                .update(cars)
                .set({ status: 'reserved', updatedAt: new Date() })
                .where(and(eq(cars.id, rental.carId), eq(cars.status, 'payment-pending')))
            }
          } else {
            // Payment failed — mark payment record
            await db
              .update(payments)
              .set({
                status: 'failed',
                externalRef: transId || null,
                respondedAt,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id))

            // Release car back to available
            const [rental] = await db
              .select({ carId: rentals.carId })
              .from(rentals)
              .where(eq(rentals.id, payment.rentalId))
              .limit(1)

            if (rental) {
              await db
                .update(cars)
                .set({ status: 'available', updatedAt: new Date() })
                .where(and(eq(cars.id, rental.carId), eq(cars.status, 'payment-pending')))
            }
          }

          // iPay88 expects "RECEIVEOK" in the response body
          return new Response('RECEIVEOK', { status: 200 })
        } catch (err) {
          console.error('[iPay88 webhook]', err)
          return new Response('Internal error', { status: 500 })
        }
      },
    },
  },
})
