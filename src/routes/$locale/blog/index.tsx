import { createFileRoute } from '@tanstack/react-router'

import { BlogIndexPage } from '#/components/blog/BlogIndexPage'
import type { Locale } from '#/i18n/locales'
import { getBlogPostsFn } from '#/lib/blog/functions'
import { getAllPosts } from '#/lib/blog/utils'
import { blogSeoMeta } from '#/lib/seo-locale-meta'

export const Route = createFileRoute('/$locale/blog/')({
  loader: async () => {
    const posts = getAllPosts(await getBlogPostsFn())
    return { posts }
  },
  head: ({ params }) => blogSeoMeta(params.locale as Locale),
  component: BlogIndexRoute,
})

function BlogIndexRoute() {
  const { posts } = Route.useLoaderData()
  return <BlogIndexPage posts={posts} />
}
