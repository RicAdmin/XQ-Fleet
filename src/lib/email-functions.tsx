import { ServerClient } from 'postmark'
import { render } from '@react-email/render'

import {
  AdminBookingNotificationEmail,
  type AdminBookingNotificationEmailProps,
} from '#/emails/AdminBookingNotificationEmail'
import {
  BookingConfirmationEmail,
  type BookingConfirmationEmailProps,
} from '#/emails/BookingConfirmationEmail'
import { PaymentFailedEmail, type PaymentFailedEmailProps } from '#/emails/PaymentFailedEmail'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailResult = { ok: true } | { ok: false; error: string }

// ─── Postmark client ──────────────────────────────────────────────────────────

function getClient(): ServerClient {
  const token = process.env.POSTMARK_SERVER_TOKEN
  if (!token) throw new Error('POSTMARK_SERVER_TOKEN is not set')
  return new ServerClient(token)
}

// ─── Internal send helper ─────────────────────────────────────────────────────

async function sendEmail(params: {
  to: string
  subject: string
  html: string
  tag?: string
}): Promise<EmailResult> {
  try {
    const client = getClient()
    const from = process.env.POSTMARK_FROM_EMAIL ?? 'cs@xqholidays.com.my'
    await client.sendEmail({
      From: from,
      To: params.to,
      Subject: params.subject,
      HtmlBody: params.html,
      TextBody: '',
      MessageStream: 'outbound',
      Tag: params.tag,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[email] Failed to send to ${params.to}: ${message}`)
    return { ok: false, error: message }
  }
}

// ─── Public send functions ────────────────────────────────────────────────────

export async function sendBookingConfirmation(
  props: BookingConfirmationEmailProps,
): Promise<EmailResult> {
  if (!props.customerEmail) {
    console.warn('[email] skipping booking confirmation — no customer email', props.bookingRef)
    return { ok: false, error: 'no customer email' }
  }
  const html = await render(BookingConfirmationEmail(props))
  return sendEmail({
    to: props.customerEmail,
    subject: `Booking confirmed · ${props.carMake} ${props.carModel} · ${props.bookingRef}`,
    html,
    tag: 'booking-confirmation',
  })
}

export async function sendPaymentFailed(props: PaymentFailedEmailProps): Promise<EmailResult> {
  if (!props.customerEmail) {
    console.warn('[email] skipping payment failed — no customer email', props.bookingRef)
    return { ok: false, error: 'no customer email' }
  }
  const html = await render(PaymentFailedEmail(props))
  return sendEmail({
    to: props.customerEmail,
    subject: `Payment unsuccessful — action needed for booking ${props.bookingRef}`,
    html,
    tag: 'payment-failed',
  })
}

export async function sendAdminBookingNotification(
  props: AdminBookingNotificationEmailProps,
): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_EMAIL not set — skipping admin notification for', props.bookingRef)
    return { ok: false, error: 'ADMIN_EMAIL not configured' }
  }
  const html = await render(AdminBookingNotificationEmail(props))
  return sendEmail({
    to: adminEmail,
    subject: `New booking · ${props.customerName ?? props.customerEmail} · ${props.carMake} ${props.carModel} · ${props.bookingRef}`,
    html,
    tag: 'admin-booking-notification',
  })
}

// ─── Compound helpers used by webhook ────────────────────────────────────────

/** Fires both buyer confirmation + admin notification after successful payment.
 *  Uses Promise.allSettled so one failure doesn't suppress the other.
 *  Errors are logged but never thrown — callers fire-and-forget. */
export async function sendBookingSuccessEmails(
  confirmation: BookingConfirmationEmailProps,
  adminNotif: AdminBookingNotificationEmailProps,
): Promise<void> {
  const results = await Promise.allSettled([
    sendBookingConfirmation(confirmation),
    sendAdminBookingNotification(adminNotif),
  ])
  results.forEach((r, i) => {
    const label = i === 0 ? 'buyer confirmation' : 'admin notification'
    if (r.status === 'rejected') {
      console.error(`[email] ${label} threw unexpectedly`, r.reason)
    } else if (!r.value.ok) {
      console.error(`[email] ${label} failed:`, r.value.error)
    }
  })
}
