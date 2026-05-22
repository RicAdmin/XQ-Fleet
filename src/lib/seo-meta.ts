import { publicSitePath } from '#/lib/brand'

/** Default share image for marketing pages (1200×630-friendly). */
export const SEO_OG_IMAGE = '/image/Langkawi Car Rental - Pick This Car.png'

export const SEO_OG_LOGO = '/image/xqCarLogo.png'

export function ogImageUrl(imagePath = SEO_OG_IMAGE): string {
  return publicSitePath(imagePath)
}

export function socialImageMeta(imagePath = SEO_OG_IMAGE, card: 'summary_large_image' | 'summary' = 'summary_large_image') {
  return [
    { property: 'og:image', content: ogImageUrl(imagePath) },
    { name: 'twitter:card', content: card },
  ] as const
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: publicSitePath(item.path),
    })),
  }
}

export function jsonLdScript(data: unknown) {
  return JSON.stringify(data)
}
