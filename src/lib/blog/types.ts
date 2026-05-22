export const BLOG_CATEGORIES = [
  'All',
  'Guides',
  'Airport & Pickup',
  'Planning',
  'Driving',
  'Pricing',
] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export type BlogAuthor = {
  name: string
  role: string
  bio: string
}

export type BlogSection =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }

export type BlogPost = {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  category: Exclude<BlogCategory, 'All'>
  tag: string
  publishedAt: string
  updatedAt: string
  readTimeMin: number
  author: BlogAuthor
  heroImage: string
  excerpt: string
  lead: string
  sections: BlogSection[]
  featured?: boolean
  keywords: string[]
}
