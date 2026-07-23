import { spawnSync } from 'node:child_process'

import { describe, expect, it } from 'vitest'

import { parseBlogMarkdown } from '#/lib/blog/markdown'

const archive = import.meta.glob<string>('/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const validPost = `---
title: Airport pickup
metaTitle: Airport pickup | XQ Car
metaDescription: A useful airport pickup guide.
category: Airport & Pickup
tag: Airport
language: en
publishedAt: '2026-07-01'
updatedAt: '2026-07-02'
heroImage: /image/airport.jpg
excerpt: Know where to meet the XQ Car team.
keywords:
  - langkawi airport pickup
---
Meet the team at Door 3 after collecting your luggage.

## Where to meet

Walk into the arrivals hall and follow the Door 3 signs.
`

describe('parseBlogMarkdown', () => {
  it('loads the sanitizer with the AWS Lambda module flags', () => {
    const result = spawnSync(
      process.execPath,
      ['--no-experimental-require-module', '-e', "require('sanitize-html')"],
      { cwd: process.cwd(), encoding: 'utf8' },
    )

    expect(result.status, result.stderr).toBe(0)
  })

  it('parses the complete migrated archive with unique filename slugs', async () => {
    const posts = await Promise.all(
      Object.entries(archive).map(([path, raw]) => {
        const slug = path.replace(/^.*\//, '').replace(/\.md$/, '')
        return parseBlogMarkdown(slug, raw)
      }),
    )

    expect(posts).toHaveLength(20)
    expect(new Set(posts.map((post) => post.slug)).size).toBe(20)
    expect(posts.filter((post) => post.language === 'ms')).toHaveLength(3)
    expect(posts.filter((post) => post.language === 'zh')).toHaveLength(1)
  })

  it('parses frontmatter and derives the lead, body, author, and read time', async () => {
    const post = await parseBlogMarkdown('airport-pickup', validPost)

    expect(post.slug).toBe('airport-pickup')
    expect(post.language).toBe('en')
    expect(post.lead).toBe(
      'Meet the team at Door 3 after collecting your luggage.',
    )
    expect(post.body).toContain('<h2>Where to meet</h2>')
    expect(post.author.name).toBe('XQCar Team')
    expect(post.readTimeMin).toBe(4)
  })

  it('rejects unknown frontmatter and invalid categories', async () => {
    const invalid = validPost
      .replace('category: Airport & Pickup', 'category: News')
      .replace('tag: Airport', 'tag: Airport\nunknown: value')

    await expect(parseBlogMarkdown('invalid', invalid)).rejects.toThrow(
      'invalid frontmatter',
    )
  })

  it('wraps markdown tables for horizontal scroll styling', async () => {
    const withTable = validPost.replace(
      'Walk into the arrivals hall and follow the Door 3 signs.',
      '| Origin | Notes |\n| --- | --- |\n| Malaysia | Bring MyKad |',
    )

    const post = await parseBlogMarkdown('with-table', withTable)

    expect(post.body).toContain('<div class="post-table-wrap"><table>')
    expect(post.body).toContain('</table></div>')
  })

  it('sanitizes unsafe HTML from the Markdown body', async () => {
    const unsafe = validPost.replace(
      'Walk into the arrivals hall and follow the Door 3 signs.',
      '<script>alert(1)</script>\n\n[Safe](https://carxq.com) [Unsafe](javascript:alert(1))',
    )

    const post = await parseBlogMarkdown('safe', unsafe)

    expect(post.body).not.toContain('<script>')
    expect(post.body).not.toContain('javascript:')
    expect(post.body).toContain('https://carxq.com')
  })

  it('requires a plain-text lead followed by article content', async () => {
    const withoutLead = validPost.replace(
      'Meet the team at Door 3 after collecting your luggage.\n\n',
      '## Where to meet\n\n',
    )

    await expect(
      parseBlogMarkdown('without-lead', withoutLead),
    ).rejects.toThrow('plain-text lead paragraph')
  })

  it('requires translated filename suffixes to match their language', async () => {
    const malay = validPost.replace('language: en', 'language: ms')

    await expect(parseBlogMarkdown('airport-pickup', malay)).rejects.toThrow(
      'filename suffix does not match language ms',
    )
    await expect(
      parseBlogMarkdown('airport-pickup-ms', malay),
    ).resolves.toMatchObject({ language: 'ms' })
  })

  it('rejects malformed dates, invalid languages, and missing frontmatter', async () => {
    const badDate = validPost.replace(
      "publishedAt: '2026-07-01'",
      "publishedAt: '07/01/2026'",
    )
    const badLanguage = validPost.replace('language: en', 'language: jp')
    const missingTitle = validPost.replace('title: Airport pickup\n', '')

    await expect(parseBlogMarkdown('bad-date', badDate)).rejects.toThrow(
      /content\/blog\/bad-date\.md: invalid frontmatter/,
    )
    await expect(
      parseBlogMarkdown('bad-language', badLanguage),
    ).rejects.toThrow(/content\/blog\/bad-language\.md: invalid frontmatter/)
    await expect(
      parseBlogMarkdown('missing-title', missingTitle),
    ).rejects.toThrow(/content\/blog\/missing-title\.md: invalid frontmatter/)
  })
})
