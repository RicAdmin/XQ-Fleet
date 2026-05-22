import { Link } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2 } from 'lucide-react'

import { BlogPostContent } from '#/components/blog/BlogPostContent'
import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import type { BlogPost } from '#/lib/blog/types'
import { formatBlogDate, getRelatedPosts } from '#/lib/blog/utils'
import { publicSitePath } from '#/lib/brand'
import { breadcrumbSchema } from '#/lib/seo-meta'

function BlogAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <span className={`blog-avatar ${size}`} aria-hidden>
      {initials}
    </span>
  )
}

type BlogPostPageProps = {
  post: BlogPost
  allPosts: BlogPost[]
}

export function BlogPostPage({ post, allPosts }: BlogPostPageProps) {
  const related = getRelatedPosts(allPosts, post, 3)
  const shareUrl = publicSitePath(`/blog/${post.slug}`)

  function shareNative() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share({ title: post.title, url: shareUrl })
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(shareUrl)
    }
  }

  return (
    <PublicMarketingShell screenLabel={`Blog · ${post.title}`} mainClassName="blog-post-page">
      <article>
        <header
          className="post-hero"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(14,18,20,.35) 0%, rgba(14,18,20,.85) 100%), url(${post.heroImage})`,
          }}
        >
          <Link to="/blog" className="close-btn" aria-label="Back to journal">
            <ArrowLeft size={16} />
          </Link>
          <div className="post-hero-inner">
            <span className="post-hero-tag">{post.category}</span>
            <h1>{post.title}</h1>
            <div className="post-hero-meta">
              <span>
                <BlogAvatar name={post.author.name} size="lg" />
                <span>
                  <strong>{post.author.name}</strong>
                  <em>{post.author.role}</em>
                </span>
              </span>
              <span className="post-hero-meta-sep" aria-hidden />
              <span>
                <Calendar size={13} aria-hidden />
                {formatBlogDate(post.publishedAt)}
              </span>
              <span className="post-hero-meta-sep" aria-hidden />
              <span>
                <Clock size={13} aria-hidden />
                {post.readTimeMin} min read
              </span>
            </div>
          </div>
        </header>

        <div className="post-shell">
          <aside className="post-side" aria-label="Article tools">
            <div className="post-side-card">
              <strong style={{ fontSize: 13, fontWeight: 600 }}>Share</strong>
              <div className="post-share">
                <button type="button" className="post-share-btn" onClick={shareNative} aria-label="Share article">
                  <Share2 size={15} />
                </button>
              </div>
            </div>
            <div className="post-side-card">
              <div className="post-side-author">
                <BlogAvatar name={post.author.name} size="lg" />
                <strong>{post.author.name}</strong>
                <em>{post.author.role}</em>
                <p>{post.author.bio}</p>
              </div>
            </div>
            <div className="post-side-card">
              <strong style={{ fontSize: 13, fontWeight: 600 }}>Updated</strong>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                {formatBlogDate(post.updatedAt)}
              </p>
            </div>
          </aside>

          <div className="post-body">
            <p className="post-lead">{post.lead}</p>
            <BlogPostContent sections={post.sections} />

            <div className="post-cta">
              <div>
                <strong>Ready to explore Langkawi?</strong>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted)' }}>
                  Book from RM 70/day · free airport delivery
                </p>
              </div>
              <Link to="/" hash="booking-dock" className="btn btn-leaf">
                Search cars <ArrowRight size={14} />
              </Link>
            </div>

            <footer className="post-footer">
              <div className="post-footer-tags">
                {post.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="chip">
                    {kw}
                  </span>
                ))}
              </div>
              <div className="post-footer-author">
                <BlogAvatar name={post.author.name} />
                <span>
                  <strong>{post.author.name}</strong>
                  <em>{post.author.role}</em>
                </span>
              </div>
            </footer>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="post-more" aria-labelledby="related-posts-heading">
          <h2 id="related-posts-heading" className="h-section" style={{ marginBottom: 16 }}>
            Related guides
          </h2>
          <div className="blog-grid" style={{ padding: 0 }}>
            {related.map((r) => (
              <Link key={r.slug} to="/blog/$slug" params={{ slug: r.slug }} className="blog-card">
                <div
                  className="blog-card-img"
                  style={{ backgroundImage: `url(${r.heroImage})` }}
                  role="img"
                  aria-label={r.title}
                />
                <div className="blog-card-body">
                  <span className="blog-card-tag">{r.category}</span>
                  <h3>{r.title}</h3>
                  <p>{r.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PublicMarketingShell>
  )
}

export function BlogArticleStructuredData({ post }: { post: BlogPost }) {
  const url = publicSitePath(`/blog/${post.slug}`)
  const blogPosting = {
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: post.heroImage.startsWith('http') ? post.heroImage : publicSitePath(post.heroImage),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: publicSitePath('/about'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Car XQ',
      logo: {
        '@type': 'ImageObject',
        url: publicSitePath('/image/xqCarLogo.png'),
      },
    },
    mainEntityOfPage: url,
    keywords: post.keywords.join(', '),
  }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      blogPosting,
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
