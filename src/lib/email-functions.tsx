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
import { appendSpamFolderNotice } from '#/emails/email-helpers'
import { absolutePublicUrl } from '#/lib/brand'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailResult = { ok: true } | { ok: false; error: string }

function logAuthEmailLink(kind: string, url: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[email] ${kind} link:`, url)
  }
}

function logAuthEmailFailure(kind: string, url: string, error: string) {
  console.error(`[email] Failed to send ${kind} (${error}). Link:`, url)
}

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
      HtmlBody: appendSpamFolderNotice(params.html),
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

export async function sendEmailVerification(params: {
  to: string
  name?: string | null
  url: string
}): Promise<EmailResult> {
  logAuthEmailLink('verification', params.url)
  const greeting = params.name?.trim() ? `Hi ${params.name.trim()},` : 'Hi,'
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#14181a">
<p>${greeting}</p>
<p>Thanks for creating your XQCar account. Please verify your email to finish setting up your profile:</p>
<p><a href="${params.url}" style="display:inline-block;padding:12px 18px;background:#ff6600;color:#fff;text-decoration:none;border-radius:999px;font-weight:600">Verify email</a></p>
<p>Or copy this link:<br><a href="${params.url}">${params.url}</a></p>
<p>If you did not create this account, you can ignore this email.</p>
</body></html>`

  if (!process.env.POSTMARK_SERVER_TOKEN) {
    console.warn('[email] POSTMARK_SERVER_TOKEN not set — verification link:', params.url)
    return { ok: true }
  }

  const result = await sendEmail({
    to: params.to,
    subject: 'Verify your XQCar account',
    html,
    tag: 'email-verification',
  })
  if (!result.ok) logAuthEmailFailure('verification email', params.url, result.error)
  return result
}

export async function sendPasswordResetEmail(params: {
  to: string
  name?: string | null
  url: string
}): Promise<EmailResult> {
  logAuthEmailLink('password reset', params.url)
  const greeting = params.name?.trim() ? `Hi ${params.name.trim()},` : 'Hi,'
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#14181a">
<p>${greeting}</p>
<p>We received a request to reset your XQCar password. Click below to choose a new password:</p>
<p><a href="${params.url}" style="display:inline-block;padding:12px 18px;background:#ff6600;color:#fff;text-decoration:none;border-radius:999px;font-weight:600">Reset password</a></p>
<p>Or copy this link:<br><a href="${params.url}">${params.url}</a></p>
<p>If you did not request this, you can ignore this email.</p>
</body></html>`

  if (!process.env.POSTMARK_SERVER_TOKEN) {
    console.warn('[email] POSTMARK_SERVER_TOKEN not set — password reset link:', params.url)
    return { ok: true }
  }

  const result = await sendEmail({
    to: params.to,
    subject: 'Reset your XQCar password',
    html,
    tag: 'password-reset',
  })
  if (!result.ok) logAuthEmailFailure('password reset email', params.url, result.error)
  return result
}

export async function sendBookingConfirmation(
  props: BookingConfirmationEmailProps,
): Promise<EmailResult> {
  if (!props.customerEmail) {
    console.warn('[email] skipping booking confirmation — no customer email', props.bookingRef)
    return { ok: false, error: 'no customer email' }
  }
  const html = await render(
    BookingConfirmationEmail({
      ...props,
      carPhotoUrl: absolutePublicUrl(props.carPhotoUrl),
    }),
  )
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
