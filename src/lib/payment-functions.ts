import crypto from 'node:crypto'

import { createServerFn } from '@tanstack/react-start'

import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE, isLocale } from '#/i18n/locales'
import { getRequestSession } from '#/lib/auth-functions'
import { paymentCallbackPath } from '#/lib/brand'
import { logIpay88 } from '#/lib/ipay88-log'
import type { PaymentSettingsRow } from '#/lib/settings-functions'

// ─── Constants ────────────────────────────────────────────────────────────────

export const IPAY88_GATEWAY_URL = 'https://payment.ipay88.com.my/epayment/entry.asp'
export const HOLD_MINUTES = 15

// ─── Types ────────────────────────────────────────────────────────────────────

export type Ipay88FormParams = {
  MerchantCode: string
  PaymentId: string
  RefNo: string
  Amount: string
  Currency: string
  ProdDesc: string
  UserName: string
  UserEmail: string
  UserContact: string
  Remark: string
  Lang: string
  SignatureType: string
  Signature: string
  ResponseURL: string
  BackendURL: string
  Xfield1: string
  gatewayUrl: string
}

type InitiatePaymentInput = {
  rentalId: string
  locale?: Locale
}

export type InitiatePaymentResult = {
  formParams: Ipay88FormParams
  paymentId: string
}

// ─── iPay88 Signature Helpers ─────────────────────────────────────────────────

/** Formats amount in sen to RM string for the form field e.g. 5000 → "50.00" */
export function formatAmountRM(amountSen: number): string {
  return (amountSen / 100).toFixed(2)
}

/** Strips `.` and `,` from the RM string for use in signature e.g. "1,278.99" → "127899" */
function signatureAmount(amountRM: string): string {
  return amountRM.replace(/[.,]/g, '')
}

/** Computes HMAC-SHA512 hex (iPay88 OPSG standard) */
function hmacSha512hex(key: string, input: string): string {
  return crypto.createHmac('sha512', key).update(input, 'utf8').digest('hex')
}

/** Builds the iPay88 request signature: Key+Code+RefNo+Amount+Currency+Xfield1 */
export function buildRequestSignature(
  merchantKey: string,
  merchantCode: string,
  refNo: string,
  amountRM: string,
  currency: string,
  xfield1 = '',
): string {
  const raw = merchantKey + merchantCode + refNo + signatureAmount(amountRM) + currency + xfield1
  return hmacSha512hex(merchantKey, raw)
}

/** Verifies the iPay88 response/webhook signature: Key+Code+PaymentId+RefNo+Amount+Currency+Status */
export function verifyResponseSignature(
  merchantKey: string,
  merchantCode: string,
  paymentId: string,
  refNo: string,
  status: string,
  amountRM: string,
  currency: string,
  receivedSignature: string,
): boolean {
  const raw =
    merchantKey + merchantCode + paymentId + refNo + signatureAmount(amountRM) + currency + status
  return hmacSha512hex(merchantKey, raw) === receivedSignature
}

// ─── Expire stale payment holds (lazy, call before availability checks) ───────

/**
 * Reverts cars stuck in payment-pending whose hold window has expired
 * with no successful payment. Called lazily before availability checks.
 */
export async function expirePaymentHolds(): Promise<void> {
  const { db } = await import('#/db')
  const { rentals, cars, payments } = await import('#/db/schema')
  const { and, eq, lt, inArray, notExists } = await import('drizzle-orm')

  const now = new Date()

  // Find rentals whose hold window expired and have no successful payment
  const expired = await db
    .select({ id: rentals.id, carId: rentals.carId })
    .from(rentals)
    .where(
      and(
        eq(rentals.status, 'pending'),
        lt(rentals.paymentHoldExpiresAt, now),
        notExists(
          db
            .select({ id: payments.id })
            .from(payments)
            .where(and(eq(payments.rentalId, rentals.id), eq(payments.status, 'successful'))),
        ),
      ),
    )

  if (expired.length === 0) return

  const expiredRentalIds = expired.map((r) => r.id)
  const expiredCarIds = [...new Set(expired.map((r) => r.carId))]

  // Cancel expired rentals
  await db
    .update(rentals)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(inArray(rentals.id, expiredRentalIds))

  // Release cars back to available
  await db
    .update(cars)
    .set({ status: 'available', updatedAt: new Date() })
    .where(and(inArray(cars.id, expiredCarIds), eq(cars.status, 'payment-pending')))
}

// ─── Initiate payment ─────────────────────────────────────────────────────────

export const initiatePayment = createServerFn({ method: 'POST' })
  .inputValidator((input: InitiatePaymentInput) => input)
  .handler(async ({ data }): Promise<InitiatePaymentResult> => {
    const session = await getRequestSession()

    const { db } = await import('#/db')
    const { rentals, cars, customers, payments } = await import('#/db/schema')
    const { and, eq } = await import('drizzle-orm')

    // Load settings (for deposit mode — enabled flag does not gate the gateway itself)
    const { getPaymentSettings } = await import('#/lib/settings-functions')
    const settings = await getPaymentSettings()

    const merchantCode = process.env.IPAY88_MERCHANT_CODE
    const merchantKey = process.env.IPAY88_MERCHANT_KEY
    if (!merchantCode || !merchantKey) throw new Error('Payment gateway credentials are not configured. Set IPAY88_MERCHANT_CODE and IPAY88_MERCHANT_KEY in your environment.')

    const rentalSelect = {
      id: rentals.id,
      carId: rentals.carId,
      carMake: cars.make,
      carModel: cars.model,
      totalAmountSen: rentals.totalAmountSen,
      status: rentals.status,
      paymentStatus: rentals.paymentStatus,
      customerId: rentals.customerId,
      paymentHoldExpiresAt: rentals.paymentHoldExpiresAt,
      customerName: customers.fullName,
      customerEmail: customers.email,
      customerPhone: customers.phone,
    }

    let rental:
      | {
          id: string
          carId: string
          carMake: string
          carModel: string
          totalAmountSen: number
          status: string
          paymentStatus: string
          customerId: string
          paymentHoldExpiresAt: Date | null
          customerName: string | null
          customerEmail: string | null
          customerPhone: string | null
        }
      | undefined

    if (session) {
      const [customer] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.authUserId, session.user.id))
        .limit(1)
      if (!customer) throw new Error('Customer record not found.')

      ;[rental] = await db
        .select(rentalSelect)
        .from(rentals)
        .innerJoin(cars, eq(rentals.carId, cars.id))
        .innerJoin(customers, eq(rentals.customerId, customers.id))
        .where(and(eq(rentals.id, data.rentalId), eq(rentals.customerId, customer.id)))
        .limit(1)
    } else {
      ;[rental] = await db
        .select(rentalSelect)
        .from(rentals)
        .innerJoin(cars, eq(rentals.carId, cars.id))
        .innerJoin(customers, eq(rentals.customerId, customers.id))
        .where(eq(rentals.id, data.rentalId))
        .limit(1)
    }

    if (!rental) throw new Error('Rental not found.')
    if (rental.status !== 'pending') throw new Error('This booking is not awaiting payment.')
    if (rental.paymentStatus === 'paid') throw new Error('This booking has already been paid.')

    // Determine charge amount
    const settings2 = settings as PaymentSettingsRow
    const chargeSen =
      settings2.paymentMode === 'deposit' && settings2.depositAmountSen > 0
        ? settings2.depositAmountSen
        : rental.totalAmountSen

    // Void any previously pending payment attempts for this rental
    await db
      .update(payments)
      .set({ status: 'voided', updatedAt: new Date() })
      .where(and(eq(payments.rentalId, rental.id), eq(payments.status, 'pending')))

    // Create new payment record
    const [payment] = await db
      .insert(payments)
      .values({
        rentalId: rental.id,
        provider: 'ipay88',
        amountSen: chargeSen,
        currency: 'MYR',
        status: 'pending',
      })
      .returning({ id: payments.id })

    // Set car to payment-pending and record hold expiry
    const holdExpiry = new Date(Date.now() + HOLD_MINUTES * 60 * 1000)
    await db
      .update(rentals)
      .set({ paymentHoldExpiresAt: holdExpiry, updatedAt: new Date() })
      .where(eq(rentals.id, rental.id))

    await db
      .update(cars)
      .set({ status: 'payment-pending', updatedAt: new Date() })
      .where(eq(cars.id, rental.carId))

    // Build iPay88 form params
    const refNo = payment.id.replace(/-/g, '')
    const amountRM = formatAmountRM(chargeSen)
    const currency = 'MYR'
    const localeTag =
      data.locale && isLocale(data.locale) ? data.locale : DEFAULT_LOCALE
    const responsePath = paymentCallbackPath('/api/payment/response')

    const signature = buildRequestSignature(
      merchantKey,
      merchantCode,
      refNo,
      amountRM,
      currency,
      localeTag,
    )

    const backendURL = paymentCallbackPath('/api/webhooks/ipay88')

    const formParams: Ipay88FormParams = {
      MerchantCode: merchantCode,
      PaymentId: '0',
      RefNo: refNo,
      Amount: amountRM,
      Currency: currency,
      ProdDesc: `Car rental - ${rental.carMake} ${rental.carModel}`,
      UserName: rental.customerName ?? '',
      UserEmail: rental.customerEmail ?? '',
      UserContact: rental.customerPhone ?? '',
      Remark: `Rental ${data.rentalId}`,
      Lang: 'UTF-8',
      SignatureType: 'HMACSHA512',
      Signature: signature,
      ResponseURL: responsePath,
      BackendURL: backendURL,
      Xfield1: localeTag,
      gatewayUrl: IPAY88_GATEWAY_URL,
    }

    logIpay88('info', 'payment initiated', {
      rentalId: rental.id,
      paymentId: payment.id,
      refNo,
      refNoLength: refNo.length,
      amountRM,
      chargeSen,
      responseURL: responsePath,
      backendURL,
    })

    return { formParams, paymentId: payment.id }
  })
