# SEO/GEO Audit Report — 2026-07-24

Site: https://car.xqholidays.com.my · Stack: TanStack Start (SSR) on Netlify · Scope: full audit, live checks run against deployed URL

## Executive summary

- **SEO score: 81/100 (B)**
- **GEO score: 74/100 (C)**
- Strength: public pages are true SSR — titles, canonicals, Open Graph, and JSON-LD appear in raw Googlebot HTML on the live host.
- Blocker: crawl infrastructure (`robots.txt` Sitemap line, `sitemap.xml`, `llms.txt`) still advertises **https://carxq.com**, which does not resolve, while the live site and page-level canonicals correctly use **https://car.xqholidays.com.my**.
- Highest-leverage fix: point sitemap/robots/llms generation at `SITE_URL` / `car.xqholidays.com.my`, regenerate, and redeploy — then fix locale-aware canonicals on guides/legal.

## Scorecard

| Category | Score | Grade | Δ | Weight (SEO / GEO) |
|---|---|---|---|---|
| Crawlability & Indexation | 63 | D | — | 20% / 10% |
| Rendering & Technical | 95 | A | — | 20% / 15% |
| On-Page Meta | 88 | B | — | 15% / — |
| Structured Data | 75 | C | — | 10% / 20% |
| Content & E-E-A-T | 80 | B | — | 15% / 20% |
| GEO Readiness | 65 | D | — | 5% / 35% |
| Performance Signals | 89 | B | — | 15% / — |

## Findings

### 1. Crawlability & Indexation — 63

Passing: C1 robots allows indexable paths and blocks `/admin|/account|/app|/book|/checkout|/internal` (`public/robots.txt`); C2 `Sitemap:` line present; C5 no `noindex` on `/en` sample; C7 unknown path returns HTTP 404; C9 primary pages linked from landing/footer/blog.

| Check | Status | Evidence | Fix |
|---|---|---|---|
| C3 XML sitemap coverage | fail | Live `GET /sitemap.xml` → 44 URLs on host `carxq.com` only (`en`+`ms`); repo `public/sitemap.xml` has 93 URLs still on `carxq.com`; generator hardcodes host in `scripts/generate-sitemap.ts:8` | Derive SITE from `SITE_URL`/`publicSiteUrl()`, regenerate, redeploy |
| C4 sitemap URLs canonical/200 | fail | `https://carxq.com/` DNS/HTTP fails; all `<loc>` values are that host | Same as C3; sample live paths after regen |
| C6 single canonical origin | partial | http→https 301 ✓; live HTML canonicals use `car.xqholidays.com.my`; www host fails; static crawl files advertise carxq.com | Align static SEO files + document apex policy; optionally add www→apex when DNS exists |
| C8 redirect permanence | partial | Unprefixed `/about`, `/guides/know-how`, `/terms` return **307** → `/en/…`; `/` returns **302** → `/en` | Prefer 301/308 for permanent locale defaults on public marketing URLs |

### 2. Rendering & Technical — 95

Passing: R1 SSR meta+content in raw `/en` HTML (title, H1, FAQ body); R2 HTTPS + no `http://` asset refs in homepage sample; R3 viewport in `__root.tsx`; R4 clean locale paths; R6 homepage `?model=` not in canonical; R7 real 404; R8 no hash-based indexable routes.

| Check | Status | Evidence | Fix |
|---|---|---|---|
| R5 hreflang + lang | partial | Home/blog emit hreflang via `src/lib/seo-locale-meta.ts`; guides/legal omit hreflang; `/ms` raw HTML has `<html lang="en">` because `LocaleHtmlLang` sets lang in `useEffect` only (`src/components/i18n/LocaleHtmlLang.tsx`) | Server-render `lang` from locale route; reuse `seoMeta()` on guides/legal |

### 3. On-Page Meta — 88

Passing: M1/M2 unique title+description on home/about/blog samples; M4 OG+Twitter with absolute image on home/blog; M5 single H1; M7 slugs match topics; M8 private areas robots-disallowed.

| Check | Status | Evidence | Fix |
|---|---|---|---|
| M3 self-canonical | partial | `/en` + blog slug canonicals correct; `/en/guides/know-how` canonical is `https://car.xqholidays.com.my/guides/know-how` (no locale) which **307-redirects** to `/en/guides/know-how` — same pattern on terms/privacy/guides (`src/routes/$locale/guides/*.tsx`, `src/routes/$locale/terms.tsx`, etc.) | Switch those routes to `seoMeta({ locale, path, … })` / `publicLocalePath` |
| M6 heading hierarchy | partial | Blog article H1→H2 then footer `H5` skips H3/H4 in outline | Demote footer headings to styled non-heading or H2/H3 consistently |

### 4. Structured Data — 75

Passing: S1 AutoRental (`@id …/#organization`) + WebSite + FAQPage in raw `/en` HTML; S5 JSON-LD present in curl output (not client-only); S6 FAQ Q&A matches landing content; aggregateRating previously removed.

| Check | Status | Evidence | Fix |
|---|---|---|---|
| S2 entity types per template | partial | BlogPosting on posts; guides/about/legal have no entity schema | Add `WebPage`/`Article` or FAQ where fitting on guides |
| S3 required properties | partial | Blog has author/dates/image; `mainEntityOfPage` and breadcrumb `item` URLs omit locale (`BlogPostPage.tsx` uses `publicSitePath('/blog/…')`) | Use `publicLocalePath` for schema URLs |
| S4 BreadcrumbList | partial | Present on blog posts; absent on guides/about | Emit BreadcrumbList on hierarchical templates |

### 5. Content & E-E-A-T — 80

Passing: E2 published + updated dates on posts; E4 About/Privacy/Terms/PDPA/Refund linked; E5 solid operational depth on sampled posts (airport Door 3, requirements table); E6 related posts + guide links.

| Check | Status | Evidence | Fix |
|---|---|---|---|
| E1 author credentials | partial | “XQCar Team” + role/bio on template; schema links `/about`, not author pages | Named editors or richer About credentials; keep bio visible |
| E3 citations / originality | partial | Strong first-hand pickup procedures; few dated external citations | Cite JPJ/official sources where rules are asserted |
| E7 image alt text | partial | Descriptive alts on some fleet cards; empty `alt=""` on hero/reels (`CxqLandingPage.tsx`) | Add meaningful alts for informational images |

### 6. GEO Readiness — 65

Passing: G3 answer-first openings in sampled posts; G4 homepage FAQ + FAQPage; G5 lists/tables/priced facts.

| Check | Status | Evidence | Fix |
|---|---|---|---|
| G1 AI-crawler policy | partial | Explicit bot blocks/allows in `public/robots.txt`; `Content-Signal: ai-train=no` conflicts with Allow for GPTBot/ClaudeBot/Google-Extended; no `Claude-SearchBot`; no `CCBot` stance | Decide training vs search policy; allow `Claude-SearchBot`; document choice in SEO.md Notes |
| G2 llms.txt | partial | Live `GET /llms.txt` 200 with good structure, but every URL is `https://carxq.com/…` (dead) and some slugs are archived | Rewrite links to live origin + locale paths; drop dead slugs |
| G6 entity consistency | fail | No `sameAs` on AutoRental JSON-LD (removed earlier); footer has Instagram/Facebook/TikTok/Xiaohongshu (`footer-social-links.tsx`); brand strings mix `XQCar` / `XQ Car` | Add real `sameAs` profile URLs; standardize brand string in schema + copy |

### 7. Performance Signals — 89

Passing: P2 hero preload + `fetchPriority` on `$locale/index.tsx`, lazy below-fold; P3 system Helvetica stack (no webfont FOIT); P4 affiliate tracker `defer` when present; P5 Vite-split `/assets/*` bundles; P6 `Cache-Control: public,max-age=31536000,immutable` on JS; P8 TTFB `/en` ≈ 0.51s, blog ≈ 0.70s (< 0.8s). P7 n/a (no always-on critical third-party origins).

| Check | Status | Evidence | Fix |
|---|---|---|---|
| P1 modern images / dimensions | partial | Some `width`/`height`; heroes often JPG (`hero-langkawi-adventure-768.jpg`, OG PNG with spaces in filename) | Prefer WebP/AVIF + stable filenames; ensure CLS dims on LCP candidates |

## Improvement plan

### Quick wins (high impact, low effort — do this week)

1. **Align crawl host to live origin** — change `scripts/generate-sitemap.ts` SITE to `process.env.SITE_URL` / `https://car.xqholidays.com.my`; update `public/robots.txt` `Sitemap:` line; rewrite `public/llms.txt` links; run `pnpm sitemap:generate` and redeploy. Recovers **C3/C4** (~25 crawl pts) and **G2** (~7.5 GEO pts). Headline SEO impact ~+5; GEO ~+3.
2. **Locale-aware meta on guides + legal** — replace manual `head()` blocks with `seoMeta()` in `src/routes/$locale/guides/*.tsx` and legal routes. Recovers **M3/R5** (~10–12 pts combined).
3. **Locale-aware blog schema URLs** — `publicLocalePath` in `BlogArticleStructuredData` (`BlogPostPage.tsx`). Recovers **S3** (~7.5 schema pts).
4. **Add `sameAs` + allow `Claude-SearchBot`** — `seo-home-schema.ts` + `robots.txt`. Recovers **G6/G1** (~20 GEO category pts → ~7 GEO headline).
5. **301 permanent redirects** for unprefixed marketing URLs (and consider `/` → `/en` 301). Recovers **C8** (~5 crawl pts).

### Structural fixes (high impact, higher effort)

1. **Server-render `<html lang>`** from locale (stop client-only `LocaleHtmlLang` for crawlers). Files: `__root.tsx` / locale layout. Recovers rest of **R5**.
2. **Regenerate/deploy sitemap with all locales + current posts** (live still en+ms-only, 44 URLs). Ensure build runs `sitemap:generate`.
3. **Guide/about BreadcrumbList + light WebPage schema**. Recovers **S2/S4**.
4. **Image pipeline** — WebP/AVIF heroes, rename spaced OG filename, fill informational alts. Recovers **P1/E7**.

### Long-term (content & authority work)

1. Named author pages / stronger About E-E-A-T (**E1**).
2. Cite official sources for licence/IDP claims (**E3**).
3. Expand thin/archived topics or keep them out of `llms.txt`/sitemap.
4. When `carxq.com` becomes real, 301 everything to one apex and regenerate crawl files once.

## Not covered by this audit

Core Web Vitals field data (PageSpeed Insights/CrUX), backlink profile, Search Console indexation/coverage, rank tracking, and paid-channel attribution. `www.car.xqholidays.com.my` did not resolve during this run.
