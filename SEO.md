# SEO Facts — XQ Car (car.xqholidays.com.my)

Last audited: 2026-07-24 by `/seo` · Latest report: [seo-reports/seo-report-2026-07-24.md](seo-reports/seo-report-2026-07-24.md)

## Site

- Deployed URL: https://car.xqholidays.com.my
- Stack: TanStack Start (Vite + React 19 + SSR) · Drizzle/Postgres · Netlify
- Rendering: SSR for public marketing/blog/legal/guide routes (`head()` + loader data in raw HTML). Client hydration for booking UI. Admin/account/app are non-indexable.
- Hosting / CDN: Netlify (Durable Cache + Edge)

## Routes

| Route / template | Indexable | Title source | Meta desc | Canonical | Schema types |
|---|---|---|---|---|---|
| `/` → `/$locale/` | yes (via `/en` etc.) | `homeSeoMeta` / `seo.homeTitle` | yes | locale-aware absolute | AutoRental, WebSite, FAQPage |
| `/$locale/about` | yes | `aboutSeoMeta` | yes | locale-aware | none |
| `/$locale/blog` | yes | `blogSeoMeta` | yes | locale-aware | none |
| `/$locale/blog/$slug` | yes | post frontmatter `metaTitle` | `metaDescription` | locale-aware | BlogPosting + BreadcrumbList |
| `/$locale/guides/*` | yes | hardcoded per route via `seoMeta()` | yes | locale-aware | none |
| `/$locale/{terms,privacy,pdpa,rental-agreement,refund-policy}` | yes | legal document meta via `seoMeta()` | yes | locale-aware | none |
| `/$locale/{login,register,checkout,…}` | no | — | — | — | — |
| `/admin`, `/account`, `/app`, `/internal` | no | robots Disallow | — | — | — |
| Legacy unprefixed `/about`, `/blog`, `/guides/*`, … | redirect **301** → `/en/…` | — | — | — | — |

Locales: `en`, `ms`, `zh` (`zh-Hans` hreflang).

## Infrastructure

- robots.txt: `public/robots.txt` · AI search bots allowed (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`, …); `Content-Signal: ai-train=no`; `CCBot` Disallow · Sitemap: `https://car.xqholidays.com.my/sitemap.xml`
- Sitemap: `scripts/generate-sitemap.ts` → `public/sitemap.xml` · SITE from `SITE_URL` / `BETTER_AUTH_URL`, default `https://car.xqholidays.com.my` · all locales (`en`/`ms`/`zh`)
- llms.txt: `public/llms.txt` · links use live origin + `/en/…` paths
- Redirect policy: http→https 301 ✓ · `/` → negotiated locale **302** (language negotiation) · unprefixed marketing/legacy paths **301** → `/en/…` · trailing slash `/en/` → `/en` 307 · canonical origin `https://car.xqholidays.com.my`

## Content

- Content types: Markdown blog in `content/blog/` (24 posts; EN/MS/ZH variants); marketing landing; 4 trip guides; legal docs in `src/lib/legal/`
- Authorship & dates: frontmatter `publishedAt` / `updatedAt`; author block (name/role/bio) on post template; schema `Person` → `/about`
- Target keywords / priority pages: car rental Langkawi; Langkawi airport car rental (LGK Door 3); cheap car rental Langkawi; rent a car Langkawi requirements; ferry/jetty pickup; driving know-how

## Score history

| Date | SEO | GEO | Report |
|---|---|---|---|
| 2026-07-24 | 81 (B) | 74 (C) | seo-reports/seo-report-2026-07-24.md |

## Notes (manually maintained — never overwritten by `/seo`)

- Deployed URL confirmed 2026-07-24: `https://car.xqholidays.com.my` (not carxq.com).
- AI crawler policy: allow search/citation bots; `Content-Signal: ai-train=no` + `CCBot` Disallow for training corpora; GPTBot/ClaudeBot remain Allow for product crawlers that also power answers.
)
