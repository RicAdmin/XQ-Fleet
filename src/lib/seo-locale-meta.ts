import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE, LOCALES, OG_LOCALE } from '#/i18n/locales'
import { translate } from '#/i18n/translate'
import { publicLocalePath } from '#/lib/brand'
import { socialImageMeta } from '#/lib/seo-meta'

type SeoMetaInput = {
  locale: Locale
  /** Path without locale prefix, e.g. `/about` or `/blog/my-post` */
  path: string
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  ogType?: 'website' | 'article'
  imagePath?: string
}

function hreflangLinks(path: string) {
  return [
    ...LOCALES.map((loc) => ({
      rel: 'alternate' as const,
      hrefLang: loc === 'zh' ? 'zh-Hans' : loc,
      href: publicLocalePath(path, loc),
    })),
    {
      rel: 'alternate' as const,
      hrefLang: 'x-default',
      href: publicLocalePath(path, DEFAULT_LOCALE),
    },
  ]
}

export function seoMeta({
  locale,
  path,
  title,
  description,
  ogTitle,
  ogDescription,
  ogType = 'website',
  imagePath,
}: SeoMetaInput) {
  const canonical = publicLocalePath(path, locale)
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: ogTitle ?? title },
      { property: 'og:description', content: ogDescription ?? description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonical },
      { property: 'og:locale', content: OG_LOCALE[locale] },
      ...socialImageMeta(imagePath),
    ],
    links: [{ rel: 'canonical', href: canonical }, ...hreflangLinks(path)],
  }
}

export function homeSeoMeta(locale: Locale) {
  return seoMeta({
    locale,
    path: '/',
    title: translate(locale, 'seo.homeTitle'),
    description: translate(locale, 'seo.homeDescription'),
    ogTitle: translate(locale, 'seo.homeTitle'),
    ogDescription: translate(locale, 'seo.homeDescription'),
  })
}

export function aboutSeoMeta(locale: Locale) {
  return seoMeta({
    locale,
    path: '/about',
    title: translate(locale, 'seo.aboutTitle'),
    description: translate(locale, 'seo.aboutDescription'),
  })
}

export function blogSeoMeta(locale: Locale) {
  return seoMeta({
    locale,
    path: '/blog',
    title: translate(locale, 'seo.blogTitle'),
    description: translate(locale, 'seo.blogDescription'),
  })
}
