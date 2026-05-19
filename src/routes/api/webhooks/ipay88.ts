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
          const authCode = params.get('AuthCode') ?? ''
          const receivedSignature = params.get('Signature') ?? ''

          // Capture full raw response for audit
          const rawResponse = Object.fromEntries(params.entries())

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
          const { payments, rentals, cars, customers, carPhotos } = await import('#/db/schema')
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
                rawResponse,
                ipay88TransId: transId || null,
                ipay88AuthCode: authCode || null,
                callbackSource: 'callback',
                respondedAt,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id))

            // Fetch full rental + car + customer data for email (single join)
            const [rentalData] = await db
              .select({
                id: rentals.id,
                carId: rentals.carId,
                startDate: rentals.startDate,
                endDate: rentals.endDate,
                pickUpTime: rentals.pickUpTime,
                returnTime: rentals.returnTime,
                pickUpLocation: rentals.pickUpLocation,
                returnLocation: rentals.returnLocation,
                baseRentalSen: rentals.baseRentalSen,
                extraChargeSen: rentals.extraChargeSen,
                addonsTotalSen: rentals.addonsTotalSen,
                deliveryFeeSen: rentals.deliveryFeeSen,
                subTotalSen: rentals.subTotalSen,
                discountAmountSen: rentals.discountAmountSen,
                discountPercent: rentals.discountPercent,
                couponCode: rentals.couponCode,
                totalAmountSen: rentals.totalAmountSen,
                createdAt: rentals.createdAt,
                carMake: cars.make,
                carModel: cars.model,
                carYear: cars.year,
                carPlateNumber: cars.plateNumber,
                carCategory: cars.category,
                customerName: customers.fullName,
                customerEmail: customers.email,
                customerPhone: customers.phone,
              })
              .from(rentals)
              .innerJoin(cars, eq(rentals.carId, cars.id))
              .innerJoin(customers, eq(rentals.customerId, customers.id))
              .where(eq(rentals.id, payment.rentalId))
              .limit(1)

            if (rentalData) {
              // Update rental: paidAmountSen, paymentStatus='paid'
              await db
                .update(rentals)
                .set({
                  paidAmountSen: payment.amountSen,
                  paymentStatus: 'paid',
                  updatedAt: new Date(),
                })
                .where(eq(rentals.id, rentalData.id))

              // Car transitions to reserved (confirmed booking)
              await db
                .update(cars)
                .set({ status: 'reserved', updatedAt: new Date() })
                .where(and(eq(cars.id, rentalData.carId), eq(cars.status, 'payment-pending')))

              // Fetch car cover photo (optional — used in confirmation email)
              const [coverPhoto] = await db
                .select({ url: carPhotos.url })
                .from(carPhotos)
                .where(and(eq(carPhotos.carId, rentalData.carId), eq(carPhotos.isCover, true)))
                .limit(1)

              // Fire emails fire-and-forget — never block RECEIVEOK
              const { makeBookingRef } = await import('#/emails/email-helpers')
              const { sendBookingSuccessEmails } = await import('#/lib/email-functions')
              const baseUrl =
                process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
              const bookingRef = makeBookingRef(rentalData.id)
              const firstName = rentalData.customerName?.split(' ')[0] ?? 'there'

              sendBookingSuccessEmails(
                {
                  customerFirstName: firstName,
                  customerEmail: rentalData.customerEmail ?? '',
                  bookingRef,
                  bookedAt: rentalData.createdAt,
                  carMake: rentalData.carMake,
                  carModel: rentalData.carModel,
                  carYear: rentalData.carYear,
                  carPlateNumber: rentalData.carPlateNumber,
                  carCategory: rentalData.carCategory,
                  carPhotoUrl: coverPhoto?.url ?? null,
                  pickupDate: rentalData.startDate,
                  pickupTime: rentalData.pickUpTime,
                  pickupLocation: rentalData.pickUpLocation,
                  returnDate: rentalData.endDate,
                  returnTime: rentalData.returnTime,
                  returnLocation: rentalData.returnLocation,
                  baseRentalSen: rentalData.baseRentalSen,
                  extraChargeSen: rentalData.extraChargeSen,
                  addonsTotalSen: rentalData.addonsTotalSen,
                  deliveryFeeSen: rentalData.deliveryFeeSen,
                  subTotalSen: rentalData.subTotalSen,
                  discountAmountSen: rentalData.discountAmountSen,
                  discountPercent: rentalData.discountPercent,
                  couponCode: rentalData.couponCode,
                  totalAmountSen: rentalData.totalAmountSen,
                  paidAmountSen: payment.amountSen,
                },
                {
                  rentalId: rentalData.id,
                  bookingRef,
                  adminPanelUrl: `${baseUrl}/admin/rentals/${rentalData.id}`,
                  customerName: rentalData.customerName,
                  customerEmail: rentalData.customerEmail ?? '',
                  customerPhone: rentalData.customerPhone,
                  carMake: rentalData.carMake,
                  carModel: rentalData.carModel,
                  carYear: rentalData.carYear,
                  carPlateNumber: rentalData.carPlateNumber,
                  pickupDate: rentalData.startDate,
                  pickupTime: rentalData.pickUpTime,
                  pickupLocation: rentalData.pickUpLocation,
                  returnDate: rentalData.endDate,
                  returnTime: rentalData.returnTime,
                  totalAmountSen: rentalData.totalAmountSen,
                  paidAmountSen: payment.amountSen,
                  paymentMethod: paymentId || null,
                  ipay88TransId: transId || null,
                },
              ).catch((err: unknown) => {
                console.error('[iPay88 webhook] email send failed', err)
              })
            }
          } else {
            // Payment failed — mark payment record
            await db
              .update(payments)
              .set({
                status: 'failed',
                externalRef: transId || null,
                rawResponse,
                ipay88TransId: transId || null,
                ipay88AuthCode: authCode || null,
                callbackSource: 'callback',
                respondedAt,
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id))

            // Fetch rental + car + customer for failure email
            const [failedRentalData] = await db
              .select({
                id: rentals.id,
                carId: rentals.carId,
                startDate: rentals.startDate,
                pickUpTime: rentals.pickUpTime,
                pickUpLocation: rentals.pickUpLocation,
                totalAmountSen: rentals.totalAmountSen,
                carMake: cars.make,
                carModel: cars.model,
                customerName: customers.fullName,
                customerEmail: customers.email,
              })
              .from(rentals)
              .innerJoin(cars, eq(rentals.carId, cars.id))
              .innerJoin(customers, eq(rentals.customerId, customers.id))
              .where(eq(rentals.id, payment.rentalId))
              .limit(1)

            if (failedRentalData) {
              // Release car back to available
              await db
                .update(cars)
                .set({ status: 'available', updatedAt: new Date() })
                .where(
                  and(
                    eq(cars.id, failedRentalData.carId),
                    eq(cars.status, 'payment-pending'),
                  ),
                )

              // Fire failure email fire-and-forget
              const { makeBookingRef } = await import('#/emails/email-helpers')
              const { sendPaymentFailed } = await import('#/lib/email-functions')
              const baseUrl =
                process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
              const bookingRef = makeBookingRef(failedRentalData.id)

              sendPaymentFailed({
                customerFirstName: failedRentalData.customerName?.split(' ')[0] ?? 'there',
                customerEmail: failedRentalData.customerEmail ?? '',
                bookingRef,
                carMake: failedRentalData.carMake,
                carModel: failedRentalData.carModel,
                pickupDate: failedRentalData.startDate,
                pickupTime: failedRentalData.pickUpTime,
                pickupLocation: failedRentalData.pickUpLocation,
                totalAmountSen: failedRentalData.totalAmountSen,
                retryUrl: `${baseUrl}/pay/${failedRentalData.id}`,
              }).catch((err: unknown) => {
                console.error('[iPay88 webhook] failure email send failed', err)
              })
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
