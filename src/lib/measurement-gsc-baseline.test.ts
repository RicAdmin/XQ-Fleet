import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const BASELINE_DOC = join(
  ROOT,
  'seo-strategy/baselines/2026-07-24-ops-gsc-baseline.md',
)
const SEO_STRATEGY_DOC = join(ROOT, 'SEO-STRATEGY.md')
const ORGANIC_FUNNEL_DOC = join(ROOT, 'docs/measurement-organic-funnel.md')

describe('measurement GSC baseline documentation', () => {
  const baselineMd = () => readFileSync(BASELINE_DOC, 'utf8')

  it('names funnel stages with a data source for each', () => {
    const md = baselineMd()
    expect(md).toMatch(/Organic discovery/i)
    expect(md).toMatch(/Checkout start/i)
    expect(md).toMatch(/Paid booking/i)
    expect(md).toMatch(/GSC/i)
    expect(md).toMatch(/begin_checkout/)
    expect(md).toMatch(/purchase/)
  })

  it('records baseline date and GSC figures for named EN ops URLs', () => {
    const md = baselineMd()
    expect(md).toMatch(/2026-07-24/)
    expect(md).toContain('/en/blog/langkawi-airport-car-rental-pickup')
    expect(md).toContain('/en/blog/langkawi-ferry-jetty-car-rental')
    expect(md).toContain('/en/blog/rent-a-car-langkawi-requirements')
    expect(md).toContain('/en/guides/pickup-return')
    expect(md).toMatch(/Clicks.*Impressions|Impressions.*Clicks/i)
  })

  it('includes MS live URLs or explicit unavailable reason', () => {
    const md = baselineMd()
    expect(md).toContain('/ms/blog/langkawi-airport-car-rental-pickup-ms')
    expect(md).toMatch(/Processing data|0.*0|not live/i)
  })

  it('states gaps and refresh procedure', () => {
    const md = baselineMd()
    expect(md).toMatch(/## .*Gaps|## .*limitations/i)
    expect(md).toMatch(/refresh|re-pull/i)
  })
})

describe('measurement GSC baseline discoverability', () => {
  it('is linked from SEO-STRATEGY I1 notes', () => {
    const md = readFileSync(SEO_STRATEGY_DOC, 'utf8')
    expect(md).toContain('2026-07-24-ops-gsc-baseline.md')
  })

  it('cross-links from organic funnel doc', () => {
    const md = readFileSync(ORGANIC_FUNNEL_DOC, 'utf8')
    expect(md).toContain('2026-07-24-ops-gsc-baseline.md')
  })
})
