import crypto from 'node:crypto'

import { createServerFn } from '@tanstack/react-start'

import { getRequestSession } from '#/lib/auth-functions'
import type { PaymentSettingsRow } from '#/lib/settings-functions'

// ─── Constants ────────────────────────────────────────────────────────────────

export const IPAY88_GATEWAY_URL = 'https://payment.ipay88.com.my/ePayment/entry.asp'
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
  Signature: string
  ResponseURL: string
  BackendURL: string
  gatewayUrl: string
}

type InitiatePaymentInput = {
  rentalId: string
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

/** Strips the decimal from the RM string for use in signature e.g. "50.00" → "5000" */
function signatureAmount(amountRM: string): string {
  return amountRM.replace('.', '')
}

/** Computes SHA256 hex of the given string */
function sha256hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex')
}

/** Builds the iPay88 request signature */
export function buildRequestSignature(
  merchantKey: string,
  merchantCode: string,
  refNo: string,
  amountRM: string,
  currency: string,
): string {
  const raw = merchantKey + merchantCode + refNo + signatureAmount(amountRM) + currency
  return sha256hex(raw)
}

/** Verifies the iPay88 response/webhook signature */
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
    merchantKey + merchantCode + paymentId + refNo + status + signatureAmount(amountRM) + currency
  return sha256hex(raw) === receivedSignature
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
    if (!session) throw new Error('You must be signed in.')

    const { db } = await import('#/db')
    const { rentals, cars, customers, payments } = await import('#/db/schema')
    const { and, eq } = await import('drizzle-orm')

    // Load settings
    const { getPaymentSettings } = await import('#/lib/settings-functions')
    const settings = await getPaymentSettings()
    if (!settings.enabled) throw new Error('Online payment is not currently available.')

    const merchantCode = process.env.IPAY88_MERCHANT_CODE
    const merchantKey = process.env.IPAY88_MERCHANT_KEY
    if (!merchantCode || !merchantKey) throw new Error('Payment gateway not configured.')

    // Load rental + customer
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.authUserId, session.user.id))
      .limit(1)
    if (!customer) throw new Error('Customer record not found.')

    const [rental] = await db
      .select({
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
      })
      .from(rentals)
      .innerJoin(cars, eq(rentals.carId, cars.id))
      .innerJoin(customers, eq(rentals.customerId, customers.id))
      .where(and(eq(rentals.id, data.rentalId), eq(rentals.customerId, customer.id)))
      .limit(1)

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
    const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'

    const signature = buildRequestSignature(merchantKey, merchantCode, refNo, amountRM, currency)

    const formParams: Ipay88FormParams = {
      MerchantCode: merchantCode,
      PaymentId: '0',
      RefNo: refNo,
      Amount: amountRM,
      Currency: currency,
      ProdDesc: `Car rental - ${rental.carMake} ${rental.carModel}`,
      UserName: rental.customerName,
      UserEmail: rental.customerEmail ?? '',
      UserContact: rental.customerPhone,
      Remark: `Rental ${data.rentalId}`,
      Lang: 'UTF-8',
      Signature: signature,
      ResponseURL: `${baseUrl}/account/bookings/${data.rentalId}?payment=response`,
      BackendURL: `${baseUrl}/api/webhooks/ipay88`,
      gatewayUrl: IPAY88_GATEWAY_URL,
    }

    return { formParams, paymentId: payment.id }
  })
