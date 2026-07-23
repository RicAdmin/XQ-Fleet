import { LocaleLink } from '#/components/i18n/LocaleLink'
import { useT } from '#/i18n/context'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import PublicMarketingShell from '#/components/shells/PublicMarketingShell'
import { BLOG_CATEGORIES } from '#/lib/blog/types'
import type { BlogCategory, BlogPost } from '#/lib/blog/types'
import { formatBlogDate, getFeaturedPost } from '#/lib/blog/utils'

function BlogAvatar({
  name,
  size = 'sm',
}: {
  name: string
  size?: 'sm' | 'lg'
}) {
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

type BlogIndexPageProps = {
  posts: BlogPost[]
}

export function BlogIndexPage({ posts }: BlogIndexPageProps) {
  const t = useT()
  const [category, setCategory] = useState<BlogCategory>('All')
  const [query, setQuery] = useState('')

  const featured = getFeaturedPost(posts)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter((p) => {
      const catOk = category === 'All' || p.category === category
      const searchOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.includes(q))
      return catOk && searchOk
    })
  }, [posts, category, query])

  const gridPosts = filtered.filter(
    (p) => p.slug !== featured?.slug || category !== 'All' || query,
  )

  return (
    <PublicMarketingShell
      screenLabel="XQ Car Journal"
      mainClassName="blog-page"
    >
      <header className="blog-header">
        <LocaleLink to="/" className="close-btn" aria-label={t('common.back')}>
          <ArrowLeft size={16} />
        </LocaleLink>
        <div className="blog-header-text">
          <span className="eyebrow">XQ Car Journal</span>
          <h1>Langkawi car rental guides &amp; island drives.</h1>
          <p>
            Practical advice on renting, driving, and planning — written by the
            team that meets you at Langkawi Airport Door 3 every day.
          </p>
        </div>
        <div className="blog-header-stats">
          <div>
            <b>{posts.length}</b>
            <span>Articles</span>
          </div>
          <div>
            <b>2015</b>
            <span>Since</span>
          </div>
          <div>
            <b>4.9★</b>
            <span>Rated</span>
          </div>
        </div>
      </header>

      <div className="blog-toolbar">
        <div className="blog-cats" role="tablist" aria-label="Blog categories">
          {BLOG_CATEGORIES.map((cat) => {
            const count =
              cat === 'All'
                ? posts.length
                : posts.filter((p) => p.category === cat).length
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                className={`blog-cat${category === cat ? ' on' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
                <span className="blog-cat-count">{count}</span>
              </button>
            )
          })}
        </div>
        <label className="blog-search">
          <Search size={14} aria-hidden />
          <input
            type="search"
            placeholder="Search guides…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search blog articles"
          />
        </label>
      </div>

      {featured && category === 'All' && !query && (
        <LocaleLink
          to="/blog/$slug"
          params={{ slug: featured.slug }}
          className="blog-featured"
        >
          <div
            className="blog-featured-img"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.82) 100%), url(${featured.heroImage})`,
            }}
          >
            <span className="blog-featured-pin">Featured · {featured.tag}</span>
            <div className="blog-featured-body">
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="blog-featured-meta">
                <span>{formatBlogDate(featured.publishedAt)}</span>
                <span>·</span>
                <span>{featured.readTimeMin} min read</span>
              </div>
            </div>
          </div>
        </LocaleLink>
      )}

      {gridPosts.length === 0 ? (
        <div className="blog-empty">
          <h3>No articles match</h3>
          <p>Try another category or clear your search.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {gridPosts.map((post) => (
            <LocaleLink
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="blog-card"
            >
              <div
                className="blog-card-img"
                style={{ backgroundImage: `url(${post.heroImage})` }}
                role="img"
                aria-label={post.title}
              />
              <div className="blog-card-body">
                <span className="blog-card-meta">
                  {formatBlogDate(post.publishedAt)} · {post.readTimeMin} min
                </span>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="blog-card-foot">
                  <span className="blog-card-author">
                    <BlogAvatar name={post.author.name} />
                    {post.author.name}
                  </span>
                  <span className="blog-card-arrow" aria-hidden>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </LocaleLink>
          ))}
        </div>
      )}
    </PublicMarketingShell>
  )
}
