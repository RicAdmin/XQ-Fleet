# Lighthouse baseline — `/en` mobile (2026-07-24)

Source: supplied Lighthouse JSON for `https://car.xqholidays.com.my/en`.

| Metric | Baseline | Target | Local build after remediation |
|--------|----------|--------|-------------------------------|
| Performance score | 66 | ≥ 85 | (re-measure on deploy) |
| FCP | 4.4s | < 1.8s | (re-measure on deploy) |
| LCP | 5.7s (hero JPEG 768 @ 113KB) | < 2.5s | Hero AVIF ~38KB / WebP ~51KB |
| TBT | (see report) | < 200ms | (re-measure on deploy) |
| CLS | (see report) | < 0.1 | MATTA dims + hero intrinsic size |
| TTFB / document | ~638ms | < 300ms warm | Slimmer SSR car payload + season calendar in beforeLoad |
| Main JS transfer | ~273KB | < 180KB | ~227KB gzip (891→~732KB raw); still above budget |
| CSS transfer | ~64KB (28.8 + 35.5) | < 50KB | ~64KB gzip (admin CSS removed from public); landing CSS still large |
| Images | ~862KB | reduce hero + marketing | Hero + attractions + cruise converted to WebP/AVIF |

## Repeatable check

```bash
# Three-run median (install lighthouse if needed)
npx lighthouse https://car.xqholidays.com.my/en \
  --only-categories=performance,accessibility,best-practices \
  --form-factor=mobile --chrome-flags="--headless" \
  --output=json --output-path=./docs/pr-artifacts/lighthouse-en.json

pnpm build && pnpm check:asset-budget
```

## Validation notes (local, 2026-07-24)

- `pnpm test` — 195 tests passed
- `pnpm build` — success; `CarDetailDialog`, `WebMcpTools`, legal docs, `ms`/`zh` content/messages are separate chunks
- Source maps: `sourcemap: 'hidden'` (maps exist for monitoring, not linked from JS)
- SSR security headers + CSP Report-Only wired in `src/start.ts`
- Image cache: WebP/AVIF immutable 1y; other `/image/*` 30 days

## Production spot checks (pre-remediation)

- Document HSTS: `max-age=31536000` (missing `includeSubDomains; preload` on SSR HTML)
- `/image/*` Cache-Control: `max-age=604800` (7 days)
- Main chunk (local build): ~891KB raw / ~289KB gzip
