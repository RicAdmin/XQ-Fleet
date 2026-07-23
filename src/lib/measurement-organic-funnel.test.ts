import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(import.meta.dirname, '../..')
const ORGANIC_FUNNEL_DOC = join(ROOT, 'docs/measurement-organic-funnel.md')
const CONVERSION_EVENTS_DOC = join(ROOT, 'docs/measurement-conversion-events.md')
const SEO_STRATEGY_DOC = join(ROOT, 'SEO-STRATEGY.md')

describe('measurement organic funnel documentation', () => {
  const organicFunnelMd = () => readFileSync(ORGANIC_FUNNEL_DOC, 'utf8')

  it('documents same-session GA4 path from ops/blog landing to conversions', () => {
    const md = organicFunnelMd()
    expect(md).toContain('page_view')
    expect(md).toContain('begin_checkout')
    expect(md).toContain('purchase')
    expect(md).toMatch(/organic search/i)
    expect(md).toMatch(/Default Channel Group|session source.medium/i)
    expect(md).toMatch(/\/guides\/|\/blog\//)
  })

  it('states limitations of the join method', () => {
    const md = organicFunnelMd()
    expect(md).toMatch(/## Limitations/)
    expect(md).toMatch(/cross-device/i)
    expect(md).toMatch(/cleared storage|cookie|local storage/i)
    expect(md).toMatch(/low volume/i)
  })

  it('records staging and production validation steps', () => {
    const md = organicFunnelMd()
    expect(md).toMatch(/## Validation/)
    expect(md).toMatch(/staging/i)
    expect(md).toMatch(/production|spot-check|DebugView/i)
  })
})

describe('measurement organic funnel discoverability', () => {
  it('is linked from the conversion event contract (I1 / #45 handoff)', () => {
    const md = readFileSync(CONVERSION_EVENTS_DOC, 'utf8')
    expect(md).toContain('measurement-organic-funnel.md')
  })

  it('is linked from SEO-STRATEGY I1 measurement foundation', () => {
    const md = readFileSync(SEO_STRATEGY_DOC, 'utf8')
    expect(md).toContain('measurement-organic-funnel.md')
  })
})
