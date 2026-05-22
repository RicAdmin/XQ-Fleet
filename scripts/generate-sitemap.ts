import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { LOCALES, DEFAULT_LOCALE } from '../src/i18n/locales'
import { localePath } from '../src/i18n/link'
import { getBlogPosts } from '../src/lib/blog/posts'

const SITE = 'https://carxq.com'

type Entry = {
  path: string
  changefreq: string
  priority: string
  lastmod?: string
}

const staticPages: Entry[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.85' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/guides/pick-car', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/pickup-return', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/plan-drive', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/know-how', changefreq: 'monthly', priority: '0.8' },
  { path: '/terms', changefreq: 'yearly', priority: '0.4' },
  { path: '/rental-agreement', changefreq: 'yearly', priority: '0.4' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.4' },
  { path: '/pdpa', changefreq: 'yearly', priority: '0.4' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.4' },
]

const blogPages: Entry[] = getBlogPosts().map((post) => ({
  path: `/blog/${post.slug}`,
  changefreq: 'monthly',
  priority: post.featured ? '0.9' : post.slug.includes('airport') || post.slug.includes('cheap') ? '0.85' : '0.75',
  lastmod: post.updatedAt,
}))

function hreflangAlternates(barePath: string): string {
  return LOCALES.map((loc) => {
    const hreflang = loc === 'zh' ? 'zh-Hans' : loc
    const href = `${SITE}${localePath(loc, barePath)}`
    return `\n    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`
  }).concat(
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${localePath(DEFAULT_LOCALE, barePath)}" />`,
  ).join('')
}

function urlEntry({ path, changefreq, priority, lastmod }: Entry, locale: typeof LOCALES[number]): string {
  const barePath = path
  const loc = `${SITE}${localePath(locale, barePath)}`
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''
  return `  <url>
    <loc>${loc}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${hreflangAlternates(barePath)}
  </url>`
}

const allEntries = [...staticPages, ...blogPages]
const urls = LOCALES.flatMap((locale) => allEntries.map((entry) => urlEntry(entry, locale)))

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`

const outPath = resolve(process.cwd(), 'public/sitemap.xml')
writeFileSync(outPath, xml, 'utf8')
console.log(`Wrote ${urls.length} URLs (${allEntries.length} paths × ${LOCALES.length} locales) to ${outPath}`)
