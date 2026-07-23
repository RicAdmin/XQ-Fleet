import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const BLOG = join(ROOT, 'content/blog')

const MS_CLUSTER_SLUGS = [
  'langkawi-airport-car-rental-pickup-ms',
  'langkawi-ferry-jetty-car-rental-ms',
  'rent-a-car-langkawi-requirements-ms',
  'cheap-car-rental-langkawi-tips-ms',
  'langkawi-car-rental-vs-taxi-grab-ms',
] as const

const msPath = (slug: string) => `/ms/blog/${slug}`

function readPost(slug: string) {
  return readFileSync(join(BLOG, `${slug}.md`), 'utf8')
}

function msClusterLinksIn(body: string) {
  return MS_CLUSTER_SLUGS.filter((slug) => body.includes(msPath(slug)))
}

describe('MS ops cluster production (#50)', () => {
  it.each(MS_CLUSTER_SLUGS)('%s exists with language ms and booking CTA', (slug) => {
    const md = readPost(slug)
    expect(md).toMatch(/language: ms/)
    expect(md).toContain('/ms#booking-dock')
    expect(md).toMatch(/updatedAt: '2026-07-24'/)
  })

  it.each(MS_CLUSTER_SLUGS)(
    '%s links to at least two other MS cluster URLs',
    (slug) => {
      const md = readPost(slug)
      const others = msClusterLinksIn(md).filter((s) => s !== slug)
      expect(others.length).toBeGreaterThanOrEqual(2)
    },
  )

  it.each(MS_CLUSTER_SLUGS)('%s links to English counterpart', (slug) => {
    const md = readPost(slug)
    expect(md).toMatch(/Versi English|English/)
    expect(md).toMatch(/\/en\/blog\//)
  })

  it('new requirements-ms has checklist and JPJ citation', () => {
    const md = readPost('rent-a-car-langkawi-requirements-ms')
    expect(md).toMatch(/23–65/)
    expect(md).toMatch(/jpj\.gov\.my/i)
    expect(md).toMatch(/Senarai semak|senarai semak/i)
  })

  it('new cheap-tips-ms states no automatic weekly discount', () => {
    const md = readPost('cheap-car-rental-langkawi-tips-ms')
    expect(md).toMatch(/tiada diskaun.*mingguan automatik/i)
    expect(md).toMatch(/semakan 2026-07-24/)
  })

  it('new vs-grab-ms opens with decision rule', () => {
    const md = readPost('langkawi-car-rental-vs-taxi-grab-ms')
    const opening = md.split('---').slice(2).join('---')
    expect(opening).toMatch(/Grab|teksi/i)
    expect(opening).toMatch(/dua hari|2 hari/i)
  })

  it('jetty-ms links MS requirements not EN', () => {
    const md = readPost('langkawi-ferry-jetty-car-rental-ms')
    expect(md).toContain('/ms/blog/rent-a-car-langkawi-requirements-ms')
    expect(md).not.toContain('/en/blog/rent-a-car-langkawi-requirements')
  })
})

describe('MS ops cluster queue (#50)', () => {
  const queue = readFileSync(
    join(ROOT, 'plans/blog/PUBLISHING_QUEUE.md'),
    'utf8',
  )

  it('removes completed MS ops entries from queue', () => {
    const queueSection = queue.split('## Queue')[1] ?? ''
    expect(queueSection).not.toMatch(
      /rent-a-car-langkawi-requirements-ms|cheap-car-rental-langkawi-tips-ms|langkawi-car-rental-vs-taxi-grab-ms/,
    )
  })

  it('defers ZH destination posts after ops batch note', () => {
    expect(queue).toMatch(/driving-langkawi-first-time-zh/)
    expect(queue.indexOf('driving-langkawi-first-time-zh')).toBeLessThan(
      queue.indexOf('langkawi-3-day-itinerary-by-car-zh'),
    )
  })
})
