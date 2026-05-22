import { createFileRoute } from '@tanstack/react-router'

import { BlogIndexPage } from '#/components/blog/BlogIndexPage'
import { getBlogPosts } from '#/lib/blog/posts'
import { getAllPosts } from '#/lib/blog/utils'
import { publicSitePath } from '#/lib/brand'
import { SEO_OG_IMAGE, socialImageMeta } from '#/lib/seo-meta'

export const Route = createFileRoute('/blog/')({
  loader: () => {
    const posts = getAllPosts(getBlogPosts())
    return { posts }
  },
  head: () => ({
    meta: [
      {
        title: 'Langkawi Car Rental Blog · Guides & Driving Tips · Car XQ',
      },
      {
        name: 'description',
        content:
          'Expert guides on car rental in Langkawi — airport pickup, cheap rates, driving tips, itineraries, and family travel. Written by a local fleet since 2015.',
      },
      {
        property: 'og:title',
        content: 'Car XQ Journal · Langkawi Car Rental Guides',
      },
      {
        property: 'og:description',
        content:
          'Expert guides on car rental in Langkawi — airport pickup, cheap rates, driving tips, itineraries, and family travel. Written by a local fleet since 2015.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:url',
        content: publicSitePath('/blog'),
      },
      ...socialImageMeta(SEO_OG_IMAGE),
    ],
    links: [{ rel: 'canonical', href: publicSitePath('/blog') }],
  }),
  component: BlogIndexRoute,
})

function BlogIndexRoute() {
  const { posts } = Route.useLoaderData()
  return <BlogIndexPage posts={posts} />
}
