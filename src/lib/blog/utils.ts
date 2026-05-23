import type { BlogPost, BlogSection } from '#/lib/blog/types'

export function blogImage(filename: string): string {
  return `/image/Attractions/${encodeURIComponent(filename)}`
}

export function estimateReadTime(sections: BlogSection[], lead: string): number {
  const text = [lead, ...sections.map((s) => (s.type === 'ul' ? s.items.join(' ') : s.text))].join(' ')
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(4, Math.ceil(words / 200))
}

export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getAllPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
}

export function getPostBySlug(posts: BlogPost[], slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getFeaturedPost(posts: BlogPost[]): BlogPost | undefined {
  return posts.find((p) => p.featured) ?? getAllPosts(posts)[0]
}

export function getRelatedPosts(posts: BlogPost[], current: BlogPost, limit = 3): BlogPost[] {
  return getAllPosts(posts)
    .filter((p) => p.slug !== current.slug && p.category === current.category)
    .slice(0, limit)
}

export const DEFAULT_AUTHOR = {
  name: 'XQCar Team',
  role: 'Langkawi car rental · since 2015',
  bio: 'Family-run car rental on Langkawi Island. We write from daily pickup experience at the airport, jetty, and hotels — not from a mainland desk.',
  url: '/about',
} as const
