import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE, isLocale } from '#/i18n/locales'
import { publicLocalePath } from '#/lib/brand'
import { logIpay88, sanitizeIpay88Fields } from '#/lib/ipay88-log'
import { formatAmountRM, verifyResponseSignature } from '#/lib/payment-functions'
import { getCarFleetCapacity, usesSingleUnitCarStatus } from '#/lib/fleet-capacity'

export type Ipay88CallbackSource = 'callback' | 'response'

export type ProcessIpay88PaymentInput = {
  merchantCode: string
  paymentId: string
  refNo: string
  amount: string
  currency: string
  status: string
  transId: string
  authCode: string
  receivedSignature: string
  rawResponse: Record<string, string>
  source: Ipay88CallbackSource
  localeHint?: string | null
}

export type ProcessIpay88PaymentResult =
  | {
      ok: true
      rentalId: string
      locale: Locale
      guestCheckout: boolean
      outcome: 'success' | 'failed' | 'already_processed'
    }
  | {
      ok: false
      reason: 'invalid_merchant' | 'invalid_signature' | 'payment_not_found' | 'amount_mismatch'
      rentalId?: string
      locale: Locale
      guestCheckout: boolean
    }

function paymentUuidFromRefNo(refNo: string): string {
  return refNo.length === 32
    ? `${refNo.slice(0, 8)}-${refNo.slice(8, 12)}-${refNo.slice(12, 16)}-${refNo.slice(16, 20)}-${refNo.slice(20)}`
    : refNo
}

function normalizeAmountForCompare(amountRM: string): string {
  return amountRM.replace(/[.,]/g, '')
}

function resolveLocale(value: string | null | undefined): Locale {
  if (value && isLocale(value)) return value
  return DEFAULT_LOCALE
}

export async function processIpay88Payment(
  input: ProcessIpay88PaymentInput,
): Promise<ProcessIpay88PaymentResult> {
  const configuredMerchantCode = process.env.IPAY88_MERCHANT_CODE ?? ''
  const merchantKey = process.env.IPAY88_MERCHANT_KEY ?? ''
  const locale = resolveLocale(input.localeHint)
  const errDesc = input.rawResponse.ErrDesc ?? input.rawResponse.errDesc ?? ''

  logIpay88('info', `${input.source} processing`, {
    refNo: input.refNo,
    status: input.status,
    amount: input.amount,
    currency: input.currency,
    paymentId: input.paymentId,
    transId: input.transId,
    errDesc: errDesc || undefined,
    fields: sanitizeIpay88Fields(input.rawResponse),
  })

  if (input.merchantCode !== configuredMerchantCode) {
    logIpay88('error', 'merchant code mismatch', {
      source: input.source,
      refNo: input.refNo,
      received: input.merchantCode,
      configured: configuredMerchantCode || '(not set)',
    })
    return { ok: false, reason: 'invalid_merchant', locale, guestCheckout: true }
  }

  if (!merchantKey) {
    logIpay88('error', 'merchant key not configured', { source: input.source, refNo: input.refNo })
    return { ok: false, reason: 'invalid_signature', locale, guestCheckout: true }
  }

  const valid = verifyResponseSignature(
    merchantKey,
    input.merchantCode,
    input.paymentId,
    input.refNo,
    input.status,
    input.amount,
    input.currency,
    input.receivedSignature,
  )
  if (!valid) {
    logIpay88('error', 'response signature invalid', {
      source: input.source,
      refNo: input.refNo,
      status: input.status,
      amount: input.amount,
      paymentId: input.paymentId,
      signaturePresent: Boolean(input.receivedSignature),
    })
    return { ok: false, reason: 'invalid_signature', locale, guestCheckout: true }
  }

  const { db } = await import('#/db')
  const { payments, rentals, cars, customers, carPhotos } = await import('#/db/schema')
  const { eq, and } = await import('drizzle-orm')

  const paymentUuid = paymentUuidFromRefNo(input.refNo)

  const [payment] = await db
    .select({
      id: payments.id,
      rentalId: payments.rentalId,
      status: payments.status,
      amountSen: payments.amountSen,
      currency: payments.currency,
    })
    .from(payments)
    .where(eq(payments.id, paymentUuid))
    .limit(1)

  if (!payment) {
    logIpay88('error', 'payment record not found', {
      source: input.source,
      refNo: input.refNo,
      paymentUuid,
    })
    return { ok: false, reason: 'payment_not_found', locale, guestCheckout: true }
  }

  const [customerLink] = await db
    .select({ authUserId: customers.authUserId })
    .from(rentals)
    .innerJoin(customers, eq(rentals.customerId, customers.id))
    .where(eq(rentals.id, payment.rentalId))
    .limit(1)

  const guestCheckout = !customerLink?.authUserId

  if (payment.status === 'successful') {
    logIpay88('info', 'duplicate callback ignored (already successful)', {
      source: input.source,
      refNo: input.refNo,
      rentalId: payment.rentalId,
      paymentId: payment.id,
    })
    return {
      ok: true,
      rentalId: payment.rentalId,
      locale,
      guestCheckout,
      outcome: 'already_processed',
    }
  }

  if (payment.status === 'voided') {
    logIpay88('warn', 'payment attempt is voided', {
      source: input.source,
      refNo: input.refNo,
      rentalId: payment.rentalId,
      paymentId: payment.id,
    })
    return { ok: false, reason: 'payment_not_found', locale, guestCheckout, rentalId: payment.rentalId }
  }

  const expectedAmount = normalizeAmountForCompare(formatAmountRM(payment.amountSen))
  const receivedAmount = normalizeAmountForCompare(input.amount)
  if (expectedAmount !== receivedAmount) {
    logIpay88('error', 'amount mismatch', {
      source: input.source,
      refNo: input.refNo,
      rentalId: payment.rentalId,
      expectedAmount,
      receivedAmount,
      expectedRM: formatAmountRM(payment.amountSen),
      receivedRM: input.amount,
    })
    return {
      ok: false,
      reason: 'amount_mismatch',
      locale,
      guestCheckout,
      rentalId: payment.rentalId,
    }
  }

  const isSuccess = input.status === '1'
  const respondedAt = new Date()

  if (isSuccess) {
    await db
      .update(payments)
      .set({
        status: 'successful',
        externalRef: input.transId,
        paymentMethod: input.paymentId,
        rawResponse: input.rawResponse,
        ipay88TransId: input.transId || null,
        ipay88AuthCode: input.authCode || null,
        callbackSource: input.source,
        respondedAt,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

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
        refferqRefCode: rentals.refferqRefCode,
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
      const nowPaid = new Date()
      await db
        .update(rentals)
        .set({
          paidAmountSen: payment.amountSen,
          paymentStatus: 'paid',
          updatedAt: nowPaid,
        })
        .where(eq(rentals.id, rentalData.id))

      // Paid web bookings go straight to confirmed so ops can pick them up.
      await db
        .update(rentals)
        .set({
          status: 'confirmed',
          confirmedAt: nowPaid,
          bookingExpiresAt: null,
          paymentHoldExpiresAt: null,
          updatedAt: nowPaid,
        })
        .where(and(eq(rentals.id, rentalData.id), eq(rentals.status, 'pending')))

      const fleetCapacity = await getCarFleetCapacity(db, rentalData.carId)
      if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
        await db
          .update(cars)
          .set({ status: 'reserved', updatedAt: new Date() })
          .where(and(eq(cars.id, rentalData.carId), eq(cars.status, 'payment-pending')))
      }

      const [coverPhoto] = await db
        .select({ url: carPhotos.url })
        .from(carPhotos)
        .where(and(eq(carPhotos.carId, rentalData.carId), eq(carPhotos.isCover, true)))
        .limit(1)

      const { makeBookingRef } = await import('#/emails/email-helpers')
      const { sendBookingSuccessEmails } = await import('#/lib/email-functions')
      const baseUrl = process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
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
          adminPanelUrl: `${baseUrl}/internal/jobs/${rentalData.id}`,
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
          paymentMethod: input.paymentId || null,
          ipay88TransId: input.transId || null,
        },
      ).catch((err: unknown) => {
        console.error('[iPay88] success email send failed', err)
      })

      const { reportConversion } = await import('#/lib/affiliate-tracking-conversion.server')
      reportConversion({
        refCode: rentalData.refferqRefCode,
        bookingReference: bookingRef,
        amountCents: payment.amountSen,
        currency: payment.currency,
        customerEmail: rentalData.customerEmail ?? '',
        customerName: rentalData.customerName ?? '',
      })
    }

    logIpay88('info', 'payment successful', {
      source: input.source,
      refNo: input.refNo,
      rentalId: payment.rentalId,
      transId: input.transId,
      authCode: input.authCode || undefined,
    })

    return {
      ok: true,
      rentalId: payment.rentalId,
      locale,
      guestCheckout,
      outcome: 'success',
    }
  }

  logIpay88('warn', 'payment declined by gateway', {
    source: input.source,
    refNo: input.refNo,
    rentalId: payment.rentalId,
    status: input.status,
    errDesc: errDesc || undefined,
    transId: input.transId || undefined,
  })

  await db
    .update(payments)
    .set({
      status: 'failed',
      externalRef: input.transId || null,
      rawResponse: input.rawResponse,
      ipay88TransId: input.transId || null,
      ipay88AuthCode: input.authCode || null,
      callbackSource: input.source,
      respondedAt,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))

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
    const fleetCapacity = await getCarFleetCapacity(db, failedRentalData.carId)
    if (fleetCapacity && usesSingleUnitCarStatus(fleetCapacity)) {
      await db
        .update(cars)
        .set({ status: 'available', updatedAt: new Date() })
        .where(and(eq(cars.id, failedRentalData.carId), eq(cars.status, 'payment-pending')))
    }

    const { makeBookingRef } = await import('#/emails/email-helpers')
    const { sendPaymentFailed } = await import('#/lib/email-functions')
    const baseUrl = process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'
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
      console.error('[iPay88] failure email send failed', err)
    })
  }

  return {
    ok: true,
    rentalId: payment.rentalId,
    locale,
    guestCheckout,
    outcome: 'failed',
  }
}

export function ipay88ParamsFromBody(body: string): URLSearchParams {
  return new URLSearchParams(body)
}

export function ipay88PaymentReturnUrl(opts: {
  rentalId: string
  locale: Locale
  guestCheckout: boolean
  payment: 'response' | 'error'
  siteUrl?: string
}): string {
  const path = opts.guestCheckout
    ? `/checkout/confirmed/${opts.rentalId}`
    : `/account/bookings/${opts.rentalId}`
  return `${publicLocalePath(path, opts.locale, opts.siteUrl)}?payment=${opts.payment}`
}
