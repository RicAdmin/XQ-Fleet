/**
 * Post-build asset budget check for the homepage critical path.
 * Usage: pnpm build && pnpm check:asset-budget
 *
 * Exits 0 always while the remediation is in progress unless --strict is passed.
 * Use --strict in CI once the main chunk is under budget.
 */
import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { HOMEPAGE_ASSET_BUDGETS } from '../src/lib/asset-budget'

const assetsDir = join(process.cwd(), 'dist/client/assets')
const strict = process.argv.includes('--strict')

function gzipKb(bytes: Buffer): number {
  return Math.round(gzipSync(bytes, { level: 9 }).length / 1024)
}

function main() {
  let files: string[]
  try {
    files = readdirSync(assetsDir)
  } catch {
    console.error(`Missing ${assetsDir}. Run pnpm build first.`)
    process.exit(1)
  }

  const mainJs = files.find((f) => /^main-.*\.js$/.test(f) && !f.endsWith('.map'))
  if (!mainJs) {
    console.error('No main-*.js found in dist/client/assets')
    process.exit(1)
  }

  const cssFiles = files.filter((f) => f.endsWith('.css') && !f.endsWith('.map'))
  const mainBuf = readFileSync(join(assetsDir, mainJs))
  const cssBufs = cssFiles.map((f) => readFileSync(join(assetsDir, f)))
  const mainJsGzipKb = gzipKb(mainBuf)
  const initialCssGzipKb = cssBufs.reduce((sum, buf) => sum + gzipKb(buf), 0)

  const violations: string[] = []
  if (mainJsGzipKb > HOMEPAGE_ASSET_BUDGETS.mainJsGzipKb) {
    violations.push(
      `main JS ${mainJsGzipKb}KB gzip exceeds budget ${HOMEPAGE_ASSET_BUDGETS.mainJsGzipKb}KB`,
    )
  }
  if (initialCssGzipKb > HOMEPAGE_ASSET_BUDGETS.initialCssGzipKb) {
    violations.push(
      `initial CSS ${initialCssGzipKb}KB gzip exceeds budget ${HOMEPAGE_ASSET_BUDGETS.initialCssGzipKb}KB`,
    )
  }

  console.log(
    `main JS: ${mainJs} (${(statSync(join(assetsDir, mainJs)).size / 1024).toFixed(0)}KB raw, ${mainJsGzipKb}KB gzip)`,
  )
  console.log(
    `CSS: ${cssFiles.length} files (${(cssBufs.reduce((a, b) => a + b.length, 0) / 1024).toFixed(0)}KB raw, ${initialCssGzipKb}KB gzip)`,
  )

  if (violations.length === 0) {
    console.log('Asset budgets: PASS')
    process.exit(0)
  }

  console.warn('Asset budgets: FAIL')
  for (const v of violations) console.warn(`  - ${v}`)

  if (strict) process.exit(1)
  console.warn('Non-strict mode: continuing (pass --strict to fail CI).')
  process.exit(0)
}

main()
