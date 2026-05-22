/** Public path to the XQ Car brand logo (served from `public/image/`). */
export const BRAND_LOGO_PATH = '/image/xqCarLogo.png'

function resolveSiteUrl(siteUrl?: string): string {
  const raw =
    siteUrl ??
    import.meta.env.VITE_SITE_URL ??
    process.env.SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    'http://localhost:3000'
  return raw.replace(/\/$/, '')
}

/** Normalized public origin, e.g. https://car.xqholidays.com.my */
export function publicSiteUrl(siteUrl?: string): string {
  return resolveSiteUrl(siteUrl)
}

/** Absolute public URL for a site path — avoids double slashes when env vars trail with `/`. */
export function publicSitePath(path: string, siteUrl?: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${publicSiteUrl(siteUrl)}${normalizedPath}`
}

/** Absolute URL for email clients and external links. */
export function brandLogoUrl(siteUrl?: string): string {
  return publicSitePath(BRAND_LOGO_PATH, siteUrl)
}

/** Filesystem path for server-side PDF generation. */
export function brandLogoPathFromCwd(): string {
  return `${process.cwd()}/public/image/xqCarLogo.png`
}
