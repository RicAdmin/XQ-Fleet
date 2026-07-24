/**
 * Compressed asset budgets for the marketing homepage critical path.
 * Measured against `dist/client/assets` after `pnpm build`.
 */

export const HOMEPAGE_ASSET_BUDGETS = {
  /** Initial main JS chunk (brotli/gzip transfer target). */
  mainJsGzipKb: 180,
  /** Combined initial CSS (styles + landing). */
  initialCssGzipKb: 50,
} as const

export type AssetBudgetReport = {
  mainJsGzipKb: number
  initialCssGzipKb: number
  withinBudget: boolean
  violations: string[]
}

/** Approximate gzip size from uncompressed bytes (matches typical Vite gzip ratio for JS/CSS). */
export function estimateGzipKb(uncompressedBytes: number, ratio = 0.32): number {
  return Math.round((uncompressedBytes * ratio) / 1024)
}

export function evaluateAssetBudgets(input: {
  mainJsBytes: number
  cssBytes: number[]
}): AssetBudgetReport {
  const mainJsGzipKb = estimateGzipKb(input.mainJsBytes)
  const initialCssGzipKb = estimateGzipKb(input.cssBytes.reduce((a, b) => a + b, 0))
  const violations: string[] = []

  if (mainJsGzipKb > HOMEPAGE_ASSET_BUDGETS.mainJsGzipKb) {
    violations.push(
      `main JS ~${mainJsGzipKb}KB gzip exceeds budget ${HOMEPAGE_ASSET_BUDGETS.mainJsGzipKb}KB`,
    )
  }
  if (initialCssGzipKb > HOMEPAGE_ASSET_BUDGETS.initialCssGzipKb) {
    violations.push(
      `initial CSS ~${initialCssGzipKb}KB gzip exceeds budget ${HOMEPAGE_ASSET_BUDGETS.initialCssGzipKb}KB`,
    )
  }

  return {
    mainJsGzipKb,
    initialCssGzipKb,
    withinBudget: violations.length === 0,
    violations,
  }
}
