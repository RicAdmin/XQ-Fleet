import matter from 'gray-matter'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'
import { z } from 'zod'

import { BLOG_LANGUAGES, BLOG_POST_CATEGORIES } from '#/lib/blog/types'
import type { BlogPost } from '#/lib/blog/types'
import { DEFAULT_AUTHOR, estimateReadTime } from '#/lib/blog/utils'

const BLOG_POST_SCHEMA = z
  .object({
    title: z.string().trim().min(1),
    metaTitle: z.string().trim().min(1),
    metaDescription: z.string().trim().min(1),
    category: z.enum(BLOG_POST_CATEGORIES),
    tag: z.string().trim().min(1),
    language: z.enum(BLOG_LANGUAGES),
    publishedAt: z.string().date(),
    updatedAt: z.string().date(),
    heroImage: z.string().trim().min(1),
    excerpt: z.string().trim().min(1),
    keywords: z.array(z.string().trim().min(1)).min(1),
    featured: z.boolean().optional(),
  })
  .strict()

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

function splitLead(
  markdown: string,
  source: string,
): { lead: string; body: string } {
  const normalized = markdown.trim()
  const boundary = normalized.search(/\n\s*\n/)
  if (boundary === -1) {
    throw new Error(
      `${source}: article body must contain a lead paragraph and at least one section`,
    )
  }

  const lead = normalized.slice(0, boundary).trim()
  if (/^(#|[-*+]\s|\d+\.\s)/.test(lead)) {
    throw new Error(
      `${source}: article body must begin with a plain-text lead paragraph`,
    )
  }

  return { lead, body: normalized.slice(boundary).trim() }
}

function wrapTables(html: string): string {
  return html
    .replace(/<table(\s[^>]*)?>/gi, '<div class="post-table-wrap"><table$1>')
    .replace(/<\/table>/gi, '</table></div>')
}

export async function parseBlogMarkdown(
  slug: string,
  raw: string,
): Promise<BlogPost> {
  const source = `content/blog/${slug}.md`
  const { data, content } = matter(raw)
  const parsed = BLOG_POST_SCHEMA.safeParse(data)
  if (!parsed.success) {
    throw new Error(
      `${source}: invalid frontmatter\n${z.prettifyError(parsed.error)}`,
    )
  }

  const expectedSuffix =
    parsed.data.language === 'en' ? '' : `-${parsed.data.language}`
  if (
    (expectedSuffix && !slug.endsWith(expectedSuffix)) ||
    (!expectedSuffix && /-(ms|zh)$/.test(slug))
  ) {
    throw new Error(
      `${source}: filename suffix does not match language ${parsed.data.language}`,
    )
  }

  const { lead, body } = splitLead(content, source)
  const renderedBody = wrapTables(
    sanitizeHtml(await marked.parse(body), SANITIZE_OPTIONS),
  )

  return {
    slug,
    ...parsed.data,
    readTimeMin: estimateReadTime(content),
    author: DEFAULT_AUTHOR,
    lead,
    body: renderedBody,
  }
}
