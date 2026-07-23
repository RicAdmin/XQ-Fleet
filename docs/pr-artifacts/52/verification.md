# Issue #52 — Live MS ops URL + sitemap verification

**Verified (UTC):** 2026-07-23T23:02:49Z–2026-07-23T23:03:53Z  
**Host:** `https://car.xqholidays.com.my`  
**Prerequisite:** #50 merged (`3f597d7` / PR #65) and pages reachable on live host

## Delivery acceptance

| Criterion | Pass | Evidence |
| --- | --- | --- |
| Required MS URLs return 200 | ✅ | Live HTTP checks below |
| Each appears in live sitemap (or documented generator/deploy gap with follow-up) | ✅ (gap + follow-up) | Live sitemap missing 3 new MS `<loc>`s; root cause + regen in this PR |
| Notes posted on this issue | ✅ | Issue comment + this artifact |

## Live HTTP checks (2026-07-23T23:02:49Z UTC)

| MS URL | HTTP | Final URL | Netlify request id |
| --- | --- | --- | --- |
| `/ms/blog/langkawi-airport-car-rental-pickup-ms` | 200 | same | `01KY8KF82MAXH64XRWF4JPCZX6` |
| `/ms/blog/langkawi-ferry-jetty-car-rental-ms` | 200 | same | `01KY8KF8BYQ6FSATGCCBVJMW8V` |
| `/ms/blog/rent-a-car-langkawi-requirements-ms` | 200 | same | `01KY8KF8WAQAHVX77VGZCJFHCD` |
| `/ms/blog/cheap-car-rental-langkawi-tips-ms` | 200 | same | `01KY8KF96J8RSDDS2DNHG786ZN` |
| `/ms/blog/langkawi-car-rental-vs-taxi-grab-ms` | 200 | same | `01KY8KF9FZWM25ZR24XG4S63N7` |

`robots.txt` declares `Sitemap: https://car.xqholidays.com.my/sitemap.xml`.

## Live sitemap observation (pre-regen)

Fetched `https://car.xqholidays.com.my/sitemap.xml` at verification time. Content matched committed `public/sitemap.xml` (`md5 479716f3114df827fcab79e8ea079658`, 72459 bytes).

| Slug | Live `<loc>` for `/ms/blog/...` |
| --- | --- |
| `langkawi-airport-car-rental-pickup-ms` | Present |
| `langkawi-ferry-jetty-car-rental-ms` | Present |
| `rent-a-car-langkawi-requirements-ms` | **Missing** |
| `cheap-car-rental-langkawi-tips-ms` | **Missing** |
| `langkawi-car-rental-vs-taxi-grab-ms` | **Missing** |

EN counterparts for the three new intents were already present in the live sitemap.

## Generator / deploy gap (root cause)

1. #50 added the three new `content/blog/*-ms.md` posts and upgraded airport/jetty MS, but did **not** update `public/sitemap.xml`.
2. Netlify `pnpm build` runs `tsx scripts/generate-well-known-static.ts && vite build` only — it does **not** run `pnpm sitemap:generate`.
3. Live host therefore served the stale committed sitemap while SSR already rendered the new MS pages (HTTP 200).

## Follow-up delivered in this PR

Ran `pnpm sitemap:generate` against `main` + #50 content. Regenerated `public/sitemap.xml` now includes:

- `https://car.xqholidays.com.my/ms/blog/rent-a-car-langkawi-requirements-ms`
- `https://car.xqholidays.com.my/ms/blog/cheap-car-rental-langkawi-tips-ms`
- `https://car.xqholidays.com.my/ms/blog/langkawi-car-rental-vs-taxi-grab-ms`

(plus the matching `/en/...` and `/zh/...` locale mirrors produced by the existing generator).

**Residual:** Live `<loc>` presence for the three new MS URLs requires merge + production deploy of this sitemap artifact. Re-check live sitemap after deploy.

## Observed hreflang (non-goal; observation only)

Live HTML responses for the new MS URLs returned 200 with SSR content; no hreflang engineering performed. Existing sitemap entries continue to emit `xhtml:link` alternates per generator behavior.

## Limitations

- No rankings, impressions, clicks, or conversion outcomes claimed.
- Live sitemap `<loc>` for the three new MS URLs remains pending deploy of this PR.
- Optional build-hook to auto-run `sitemap:generate` is out of scope (engineering); process remains manual regen on content publish until then.
