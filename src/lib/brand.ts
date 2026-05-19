/** Public path to the XQ Car brand logo (served from `public/image/`). */
export const BRAND_LOGO_PATH = '/image/xqCarLogo.png'

/** Absolute URL for email clients and external links. */
export function brandLogoUrl(siteUrl?: string): string {
  const base = (siteUrl ?? process.env.SITE_URL ?? process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  )
  return `${base}${BRAND_LOGO_PATH}`
}

/** Filesystem path for server-side PDF generation. */
export function brandLogoPathFromCwd(): string {
  return `${process.cwd()}/public/image/xqCarLogo.png`
}
