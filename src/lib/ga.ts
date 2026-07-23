/**
 * Google Analytics 4 (gtag) helpers.
 * Measurement ID comes from VITE_GA_MEASUREMENT_ID (public; baked at build time).
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID_RE = /^G-[A-Z0-9]+$/

/** Client-side dedupe so remounts / Strict Mode do not double-count conversions. */
const firedPurchaseIds = new Set<string>()
const firedBeginCheckoutKeys = new Set<string>()

export type GaEventParams = Record<string, string | number | boolean | undefined>

/** Test helper — clears conversion dedupe sets between cases. */
export function resetGaClientDedupeForTests(): void {
  firedPurchaseIds.clear()
  firedBeginCheckoutKeys.clear()
}

export function gaMeasurementId(): string | null {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (typeof id !== 'string') return null
  const trimmed = id.trim()
  return MEASUREMENT_ID_RE.test(trimmed) ? trimmed : null
}

/** Skip staff/admin shells — keep GA on public + booking funnel pages. */
export function shouldTrackPath(pathname: string): boolean {
  return !(
    pathname.startsWith('/admin') ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/internal')
  )
}

export function gaConfigScript(measurementId: string): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false});`
}

/** Returns true when the event was handed to gtag. */
export function trackGaEvent(
  eventName: string,
  params: GaEventParams = {},
  pathname = typeof window !== 'undefined' ? window.location.pathname : '',
): boolean {
  if (typeof window === 'undefined' || !window.gtag) return false
  if (!shouldTrackPath(pathname)) return false
  const id = gaMeasurementId()
  if (!id) return false
  window.gtag('event', eventName, {
    ...params,
    send_to: id,
  })
  return true
}

export function trackPageView(pathname: string, search = ''): void {
  if (typeof window === 'undefined' || !window.gtag) return
  if (!shouldTrackPath(pathname)) return
  const id = gaMeasurementId()
  if (!id) return
  const page_path = `${pathname}${search}`
  window.gtag('event', 'page_view', {
    page_path,
    page_location: `${window.location.origin}${page_path}`,
    page_title: document.title,
    send_to: id,
  })
}

/** Fire when a visitor enters a valid public checkout session (trip + car resolved). */
export function trackBeginCheckout(input: {
  pathname: string
  carId: string
  tripComplete: boolean
  currency?: string
  value?: number
}): void {
  if (!input.tripComplete || !input.carId) return
  const key = `${input.pathname}:${input.carId}`
  if (firedBeginCheckoutKeys.has(key)) return
  const fired = trackGaEvent(
    'begin_checkout',
    {
      currency: input.currency ?? 'MYR',
      ...(input.value != null ? { value: input.value } : {}),
      item_id: input.carId,
    },
    input.pathname,
  )
  if (fired) firedBeginCheckoutKeys.add(key)
}

/**
 * Fire on paid booking confirmation UI.
 * `transactionId` is the rental id (durable join key to rentals.paymentStatus).
 * `valueSen` should be the amount collected at iPay88 success (`paidAmountSen`),
 * which may be a deposit rather than the full rental total. Converted to major
 * currency units (sen / 100). Never pass email/phone/PII.
 */
export function trackPurchase(input: {
  pathname: string
  transactionId: string
  valueSen: number
  currency?: string
}): void {
  if (!input.transactionId) return
  if (firedPurchaseIds.has(input.transactionId)) return
  const fired = trackGaEvent(
    'purchase',
    {
      transaction_id: input.transactionId,
      value: input.valueSen / 100,
      currency: input.currency ?? 'MYR',
    },
    input.pathname,
  )
  if (fired) firedPurchaseIds.add(input.transactionId)
}
