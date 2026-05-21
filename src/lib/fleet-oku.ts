/** Honda N-Box — fleet’s OKU-friendly kei car (see data/Car.csv Tag_Small_OKU). */

export function isHondaNBox(car: { make: string; model: string }): boolean {
  const hay = `${car.make} ${car.model}`.toLowerCase().replace(/[\s-]+/g, '')
  return hay.includes('honda') && hay.includes('nbox')
}

/**
 * MP4 under /public or full URL. Override with VITE_OKU_NBOX_VIDEO_URL in .env.local.
 * Example: VITE_OKU_NBOX_VIDEO_URL=https://www.youtube.com/embed/VIDEO_ID
 */
export const OKU_NBOX_VIDEO_SRC: string =
  (import.meta.env.VITE_OKU_NBOX_VIDEO_URL as string | undefined)?.trim() ||
  '/video/honda-n-box-oku-guide.mp4'

export const OKU_NBOX_HEADLINE = 'OKU-friendly vehicle'

export const OKU_NBOX_SUMMARY =
  'Our Honda N-Box is set up for guests with mobility needs: sliding rear doors, a low step-in, and cabin space for a folded wheelchair.'

export const OKU_NBOX_FEATURES = [
  'Sliding rear doors for easier side access',
  'Tall cabin — comfortable headroom when transferring',
  'Rear area fits a folded manual wheelchair',
  'Automatic transmission — no clutch',
] as const

export function okuVideoIsEmbed(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url)
}

/** Convert youtu.be / watch URLs to embed form when needed. */
export function okuVideoEmbedUrl(url: string): string {
  if (url.includes('/embed/')) return url
  const short = url.match(/youtu\.be\/([^?&]+)/)
  if (short) return `https://www.youtube.com/embed/${short[1]}`
  const watch = url.match(/[?&]v=([^&]+)/)
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`
  return url
}
