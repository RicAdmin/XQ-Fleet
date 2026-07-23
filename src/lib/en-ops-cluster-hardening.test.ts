import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const BLOG = join(ROOT, 'content/blog')

const CLUSTER_SLUGS = [
  'langkawi-airport-car-rental-pickup',
  'langkawi-ferry-jetty-car-rental',
  'rent-a-car-langkawi-requirements',
  'langkawi-car-rental-insurance',
  'cheap-car-rental-langkawi-tips',
  'langkawi-car-rental-vs-taxi-grab',
] as const

const clusterPath = (slug: string) => `/en/blog/${slug}`

function readPost(slug: string) {
  return readFileSync(join(BLOG, `${slug}.md`), 'utf8')
}

function clusterLinksIn(body: string) {
  return CLUSTER_SLUGS.filter((slug) => body.includes(clusterPath(slug)))
}

describe('EN ops cluster hardening (#49)', () => {
  it.each(CLUSTER_SLUGS)('%s has answer-first opening and booking CTA', (slug) => {
    const md = readPost(slug)
    const body = md.split('---').slice(2).join('---').trim()
    const firstParagraph = body.split('\n\n')[0] ?? ''
    expect(firstParagraph.length).toBeGreaterThan(40)
    expect(md).toContain('/en#booking-dock')
    expect(md).toMatch(/updatedAt: '2026-07-24'/)
  })

  it.each(CLUSTER_SLUGS)(
    '%s links to at least four other cluster posts',
    (slug) => {
      const md = readPost(slug)
      const others = clusterLinksIn(md).filter((s) => s !== slug)
      expect(others.length).toBeGreaterThanOrEqual(4)
    },
  )

  it('requirements cites JPJ and rental agreement', () => {
    const md = readPost('rent-a-car-langkawi-requirements')
    expect(md).toMatch(/jpj\.gov\.my/i)
    expect(md).toContain('/en/rental-agreement')
    expect(md).toMatch(/23–65/)
    expect(md).toMatch(/1 year|one year/i)
  })

  it('insurance links rental agreement and names excess', () => {
    const md = readPost('langkawi-car-rental-insurance')
    expect(md).toContain('/en/rental-agreement')
    expect(md).toMatch(/excess/i)
    expect(md).toMatch(/third-party|third party/i)
  })

  it('cheap tips states no automatic weekly discount with checked date', () => {
    const md = readPost('cheap-car-rental-langkawi-tips')
    expect(md).toMatch(/no automatic/i)
    expect(md).toMatch(/checked 2026-07-24/)
  })

  it('vs-grab opens with decision rule and labels indicative ranges', () => {
    const md = readPost('langkawi-car-rental-vs-taxi-grab')
    const opening = md.split('---').slice(2).join('---')
    expect(opening).toMatch(/Grab|taxi/i)
    expect(opening).toMatch(/two or more|2\+/i)
    expect(md).toMatch(/planning ranges|not live quotes/i)
  })

  it('jetty retains not-24/7 caveat and names ferry origins', () => {
    const md = readPost('langkawi-ferry-jetty-car-rental')
    expect(md).toMatch(/24\/7|24\/7 airport/i)
    expect(md).toMatch(/Penang|Kuala Kedah|Kuala Perlis/)
  })

  it('airport states Door 3 left path and flight number', () => {
    const md = readPost('langkawi-airport-car-rental-pickup')
    expect(md).toMatch(/left/i)
    expect(md).toMatch(/Door 3/)
    expect(md).toMatch(/flight number/i)
    expect(md).toMatch(/30 minutes/i)
  })
})
