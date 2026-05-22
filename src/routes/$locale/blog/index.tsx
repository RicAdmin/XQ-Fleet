import { createFileRoute } from '@tanstack/react-router'

import { BlogIndexPage } from '#/components/blog/BlogIndexPage'
import type { Locale } from '#/i18n/locales'
import { getBlogPosts } from '#/lib/blog/posts'
import { getAllPosts } from '#/lib/blog/utils'
import { blogSeoMeta } from '#/lib/seo-locale-meta'

export const Route = createFileRoute('/$locale/blog/')({
  loader: () => {
    const posts = getAllPosts(getBlogPosts())
    return { posts }
  },
  head: ({ params }) => blogSeoMeta(params.locale as Locale),
  component: BlogIndexRoute,
})

function BlogIndexRoute() {
  const { posts } = Route.useLoaderData()
  return <BlogIndexPage posts={posts} />
}
