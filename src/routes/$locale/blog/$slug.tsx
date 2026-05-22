import { createFileRoute, notFound } from '@tanstack/react-router'

import { BlogArticleStructuredData, BlogPostPage } from '#/components/blog/BlogPostPage'
import type { Locale } from '#/i18n/locales'
import { resolveBlogPost } from '#/lib/blog/resolve'
import { getBlogPosts } from '#/lib/blog/posts'
import { getAllPosts, getPostBySlug } from '#/lib/blog/utils'
import { publicLocalePath } from '#/lib/brand'
import { seoMeta } from '#/lib/seo-locale-meta'
import { SEO_OG_IMAGE } from '#/lib/seo-meta'

export const Route = createFileRoute('/$locale/blog/$slug')({
  loader: ({ params }) => {
    const allPosts = getAllPosts(getBlogPosts())
    const post = getPostBySlug(allPosts, params.slug)
    if (!post) throw notFound()
    const locale = params.locale as Locale
    return { post: resolveBlogPost(post, locale), allPosts, locale }
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post
    if (!post) return {}
    const locale = params.locale as Locale
    const path = `/blog/${post.slug}`
    return seoMeta({
      locale,
      path,
      title: post.metaTitle,
      description: post.metaDescription,
      ogType: 'article',
      imagePath: post.heroImage.startsWith('http') ? undefined : post.heroImage || SEO_OG_IMAGE,
    })
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
