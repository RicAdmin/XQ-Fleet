import type { Locale } from '#/i18n/locales'
import { DEFAULT_LOCALE } from '#/i18n/locales'
import type { BlogPost, BlogSection } from '#/lib/blog/types'

export type BlogLocaleContent = {
  title: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  lead: string
  sections: BlogSection[]
}

export type ResolvedBlogPost = BlogPost & {
  activeLocale: Locale
}

export function resolveBlogPost(post: BlogPost, locale: Locale): ResolvedBlogPost {
  if (locale === DEFAULT_LOCALE) {
    return { ...post, activeLocale: locale }
  }

  const localized = post.locales?.[locale]
  if (!localized) {
    return { ...post, activeLocale: DEFAULT_LOCALE }
  }

  return {
    ...post,
    title: localized.title,
    metaTitle: localized.metaTitle,
    metaDescription: localized.metaDescription,
    excerpt: localized.excerpt,
    lead: localized.lead,
    sections: localized.sections,
    activeLocale: locale,
  }
}
