import { describe, expect, it } from 'vitest'

import {
  HOMEPAGE_ASSET_BUDGETS,
  estimateGzipKb,
  evaluateAssetBudgets,
} from '#/lib/asset-budget'

describe('homepage asset budgets', () => {
  it('defines performance targets from the Lighthouse remediation plan', () => {
    expect(HOMEPAGE_ASSET_BUDGETS.mainJsGzipKb).toBe(180)
    expect(HOMEPAGE_ASSET_BUDGETS.initialCssGzipKb).toBe(50)
  })

  it('estimates gzip size from uncompressed bytes', () => {
    // 891KB raw * 0.32 ≈ 285KB — matches observed ~273–289KB transfer
    expect(estimateGzipKb(891 * 1024)).toBe(285)
  })

  it('flags main JS and CSS that exceed budgets', () => {
    const report = evaluateAssetBudgets({
      mainJsBytes: 891 * 1024,
      cssBytes: [173 * 1024, 210 * 1024],
    })
    expect(report.withinBudget).toBe(false)
    expect(report.violations.length).toBeGreaterThan(0)
    expect(report.mainJsGzipKb).toBeGreaterThan(HOMEPAGE_ASSET_BUDGETS.mainJsGzipKb)
  })

  it('passes when assets are within budgets', () => {
    const report = evaluateAssetBudgets({
      mainJsBytes: 400 * 1024,
      cssBytes: [80 * 1024],
    })
    expect(report.withinBudget).toBe(true)
    expect(report.violations).toEqual([])
  })
})
