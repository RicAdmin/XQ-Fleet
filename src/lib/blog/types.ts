export const BLOG_POST_CATEGORIES = [
  'Guides',
  'Airport & Pickup',
  'Planning',
  'Driving',
  'Pricing',
] as const

export const BLOG_CATEGORIES = ['All', ...BLOG_POST_CATEGORIES] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export const BLOG_LANGUAGES = ['en', 'ms', 'zh'] as const

export type BlogLanguage = (typeof BLOG_LANGUAGES)[number]

export type BlogAuthor = {
  name: string
  role: string
  bio: string
}

export type BlogPost = {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  category: (typeof BLOG_POST_CATEGORIES)[number]
  tag: string
  language: BlogLanguage
  publishedAt: string
  updatedAt: string
  readTimeMin: number
  author: BlogAuthor
  heroImage: string
  excerpt: string
  lead: string
  body: string
  featured?: boolean
  keywords: string[]
}
