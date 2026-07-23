import { describe, expect, it } from 'vitest'

import { buildHomeStructuredData } from '#/lib/seo-home-schema'
import { BRAND_SAME_AS, breadcrumbSchema } from '#/lib/seo-meta'
import { seoMeta } from '#/lib/seo-locale-meta'

describe('seo helpers', () => {
  it('emits locale-aware canonical and hreflang', () => {
    const meta = seoMeta({
      locale: 'ms',
      path: '/guides/know-how',
      title: 'Know-how',
      description: 'Driving tips',
    })

    expect(meta.links).toEqual(
      expect.arrayContaining([
        {
          rel: 'canonical',
          href: expect.stringMatching(/\/ms\/guides\/know-how$/),
        },
        {
          rel: 'alternate',
          hrefLang: 'en',
          href: expect.stringMatching(/\/en\/guides\/know-how$/),
        },
        {
          rel: 'alternate',
          hrefLang: 'zh-Hans',
          href: expect.stringMatching(/\/zh\/guides\/know-how$/),
        },
      ]),
    )
  })

  it('builds locale-aware breadcrumb URLs', () => {
    const schema = breadcrumbSchema(
      [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: 'Post', path: '/blog/example' },
      ],
      'zh',
    )

    expect(schema.itemListElement[2].item).toMatch(/\/zh\/blog\/example$/)
  })

  it('includes Organization sameAs profiles on homepage schema', () => {
    const { autoRental } = buildHomeStructuredData('en')
    expect(autoRental.sameAs).toEqual([...BRAND_SAME_AS])
  })
})
