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
