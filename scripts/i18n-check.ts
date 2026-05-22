import { enMessages } from '../src/i18n/messages/en/index'
import { msMessages } from '../src/i18n/messages/ms/index'
import { zhMessages } from '../src/i18n/messages/zh/index'

type Tree = Record<string, string | Tree>

function flattenKeys(tree: Tree, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      keys.push(path)
    } else {
      keys.push(...flattenKeys(value, path))
    }
  }
  return keys.sort()
}

function diffKeys(source: string[], target: string[], label: string): string[] {
  const targetSet = new Set(target)
  return source.filter((key) => !targetSet.has(key)).map((key) => `${label}: ${key}`)
}

const enKeys = flattenKeys(enMessages as Tree)
const msKeys = flattenKeys(msMessages as Tree)
const zhKeys = flattenKeys(zhMessages as Tree)

const missing = [
  ...diffKeys(enKeys, msKeys, 'ms'),
  ...diffKeys(enKeys, zhKeys, 'zh'),
]

if (missing.length > 0) {
  console.error(`i18n:check failed — ${missing.length} missing key(s):\n`)
  for (const line of missing) {
    console.error(`  ${line}`)
  }
  process.exit(1)
}

console.log(`i18n:check passed — ${enKeys.length} keys in en/ms/zh`)
