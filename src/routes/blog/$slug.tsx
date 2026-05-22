import { createFileRoute, notFound } from '@tanstack/react-router'

import { BlogArticleStructuredData, BlogPostPage } from '#/components/blog/BlogPostPage'
import { getBlogPosts } from '#/lib/blog/posts'
import { getAllPosts, getPostBySlug } from '#/lib/blog/utils'
import { publicSitePath } from '#/lib/brand'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const allPosts = getAllPosts(getBlogPosts())
    const post = getPostBySlug(allPosts, params.slug)
    if (!post) throw notFound()
    return { post, allPosts }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) return {}
    return {
      meta: [
        { title: post.metaTitle },
        { name: 'description', content: post.metaDescription },
        { property: 'og:title', content: post.metaTitle },
        { property: 'og:description', content: post.metaDescription },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: publicSitePath(`/blog/${post.slug}`) },
        {
          property: 'og:image',
          content: post.heroImage.startsWith('http')
            ? post.heroImage
            : publicSitePath(post.heroImage),
        },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      links: [{ rel: 'canonical', href: publicSitePath(`/blog/${post.slug}`) }],
    }
  },
  component: BlogPostRoute,
})

function BlogPostRoute() {
  const { post, allPosts } = Route.useLoaderData()
  return (
    <>
      <BlogArticleStructuredData post={post} />
      <BlogPostPage post={post} allPosts={allPosts} />
    </>
  )
}
