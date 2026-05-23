/**
 * Print local dev setup status for auth + iPay88.
 *
 * Usage: pnpm tsx scripts/check-local-env.ts
 */
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'] })

const authUrl = (process.env.BETTER_AUTH_URL ?? '').replace(/\/$/, '')
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '')
const tunnel = (process.env.DEV_TUNNEL_URL ?? '').replace(/\/$/, '')
const skipVerify = process.env.AUTH_SKIP_EMAIL_VERIFICATION === 'true'

const checks: Array<{ ok: boolean; label: string; hint?: string }> = [
  {
    ok: Boolean(process.env.BETTER_AUTH_SECRET),
    label: 'BETTER_AUTH_SECRET is set',
    hint: 'Run: pnpm dlx @better-auth/cli secret',
  },
  {
    ok: authUrl === 'http://localhost:3000' || authUrl.startsWith('https://'),
    label: `BETTER_AUTH_URL=${authUrl || '(missing)'}`,
    hint: 'For local login use http://localhost:3000 (not production URL).',
  },
  {
    ok: Boolean(process.env.DATABASE_URL),
    label: 'DATABASE_URL is set',
  },
  {
    ok: skipVerify || Boolean(process.env.POSTMARK_SERVER_TOKEN),
    label: skipVerify
      ? 'AUTH_SKIP_EMAIL_VERIFICATION=true (email verify skipped in dev)'
      : 'POSTMARK_SERVER_TOKEN is set (or set AUTH_SKIP_EMAIL_VERIFICATION=true)',
  },
  {
    ok: Boolean(process.env.IPAY88_MERCHANT_CODE && process.env.IPAY88_MERCHANT_KEY),
    label: 'iPay88 merchant credentials configured',
    hint: 'Set IPAY88_MERCHANT_CODE and IPAY88_MERCHANT_KEY in .env.local',
  },
  {
    ok: tunnel.startsWith('https://') || siteUrl === 'http://localhost:3000',
    label: tunnel
      ? `DEV_TUNNEL_URL=${tunnel} (payment callbacks)`
      : `SITE_URL=${siteUrl || '(missing)'}`,
    hint: tunnel
      ? undefined
      : 'For iPay88: run `ngrok http 3000` and set DEV_TUNNEL_URL to the HTTPS URL.',
  },
]

console.log('\nLocal dev environment check\n')
for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.label}`)
  if (!c.ok && c.hint) console.log(`  → ${c.hint}`)
}

const allOk = checks.every((c) => c.ok)
console.log(allOk ? '\nReady for local dev.\n' : '\nFix the items above, then restart `pnpm dev`.\n')
process.exit(allOk ? 0 : 1)
