import '@tanstack/react-start/server-only'

import { parseBlogMarkdown } from '#/lib/blog/markdown'
import type { BlogPost } from '#/lib/blog/types'

const rawFiles = import.meta.glob<string>('/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

export async function getBlogPosts(): Promise<BlogPost[]> {
  const posts = await Promise.all(
    Object.entries(rawFiles).map(([path, raw]) => {
      const slug = path.replace(/^.*\//, '').replace(/\.md$/, '')
      return parseBlogMarkdown(slug, raw)
    }),
  )

  const duplicates = posts.filter(
    (post, index) =>
      posts.findIndex((candidate) => candidate.slug === post.slug) !== index,
  )
  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate blog slugs: ${duplicates.map((post) => post.slug).join(', ')}`,
    )
  }

  return posts
}
