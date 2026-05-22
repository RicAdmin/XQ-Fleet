# Car XQ — Full SEO Audit Report

**Audit date:** 22 May 2026  
**Target domain:** https://carxq.com (configured in sitemap, robots.txt, llms.txt)  
**Business type:** Local service — car rental (Langkawi, Malaysia)  
**Platform:** TanStack Start (SSR) on Netlify  

---

## Executive Summary

### SEO Health Score: **56 / 100**

| Category | Score | Weight | Weighted |
|----------|------:|-------:|---------:|
| Technical SEO | 54 | 22% | 11.9 |
| Content Quality | 54 | 23% | 12.4 |
| On-Page SEO | 55 | 20% | 11.0 |
| Schema / Structured Data | 50 | 10% | 5.0 |
| Performance (CWV) | 65 | 10% | 6.5 |
| AI Search Readiness (GEO) | 55 | 10% | 5.5 |
| Images | 72 | 5% | 3.6 |
| **Total** | | | **56** |

### Live-site caveat

- **carxq.com** did not resolve DNS during this audit (domain may be pre-launch or DNS not propagated).
- **car.xqholidays.com.my** responds but serves a **legacy build** (“XQ Car Fleet”, no meta description, no JSON-LD, no canonical). Findings below reflect the **current codebase** intended for carxq.com, not the legacy deployment.

### Top 5 critical issues

1. **`SITE_URL` must be `https://carxq.com` in production** — canonicals, `og:url`, and all JSON-LD `@id` values derive from `publicSiteUrl()` (`src/lib/brand.ts`). Wrong env = signals credited to localhost or legacy domain.
2. **Four guide pages in sitemap have zero SEO head tags** — `/guides/know-how`, `/guides/pickup-return`, `/guides/plan-drive`, `/guides/pick-car` have no title, description, or canonical.
3. **`AggregateRating` in homepage schema is hardcoded (4.9 / 980)** with no on-page review source — risk of rich-result penalty.
4. **`sameAs` uses placeholder Facebook/Instagram root URLs** — zero entity disambiguation value.
5. **Blog content is far below ranking depth** — ~240 words average vs 1,500+ word target for competitive informational queries; pillar guide ~395 words.

### Top 5 quick wins

1. Add `og:image` + `twitter:card` to homepage (`src/routes/index.tsx`).
2. Add `head()` meta to all four guide routes (copy pattern from `about.tsx`).
3. Update `public/robots.txt` — `Disallow: /admin`, `/account`, `/app`, `/book`; add `OAI-SearchBot`.
4. Remove `/login` and `/register` from `public/sitemap.xml`.
5. Expand `public/llms.txt` with `/about` and all 20 blog URLs.

---

## Technical SEO

**Score: 54/100**

### Strengths
- SSR via TanStack Start — HTML is crawlable (unlike legacy SPA-only deploy).
- `public/robots.txt` allows major crawlers + AI bots; sitemap declared.
- Homepage has title, meta description, canonical, OG basics.
- Blog posts, about, and legal pages have route-level `head()` with canonicals.
- `public/sitemap.xml` lists 34 URLs including blog, guides, legal.

### Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Critical | `SITE_URL` / canonical domain alignment | `src/lib/brand.ts`, Netlify env |
| High | Guide routes missing all meta | `src/routes/guides/*.tsx` |
| High | No `Disallow` for private routes | `public/robots.txt` |
| High | No security headers (`HSTS`, `X-Frame-Options`, etc.) | No `netlify.toml` / `_headers` |
| Medium | `/login`, `/register` in sitemap | `public/sitemap.xml` |
| Medium | Devtools bundled in production shell | `src/routes/__root.tsx` |
| Medium | Schema `SITE_URL` evaluated at module load | `src/lib/seo-home-schema.ts` |
| Low | No IndexNow | — |

### Crawlability
- Max crawl scope from sitemap: **34 pages** (well under 500 limit).
- Missing from sitemap: individual fleet/book URLs (acceptable if booking requires search params).
- Checkout `/checkout/$carId` correctly excluded.

---

## Content Quality

**Score: 54/100**

### E-E-A-T: 66/100

| Factor | Score | Notes |
|--------|------:|-------|
| Experience | 14/20 | Strong local detail (Door 3, AES cameras, fuel stops) |
| Expertise | 16/25 | JPJ/IDP law cited; single generic “Car XQ Team” author |
| Authoritativeness | 12/25 | MATTA + licence on About; placeholder social URLs |
| Trustworthiness | 24/30 | Legal suite complete; vague insurance FAQ |

### Thin content
- **20 blog posts**, average **~240 words** (target 1,500+ for competitive terms).
- Pillar `car-rental-langkawi-complete-guide` ~395 words despite `featured: true`.
- Six posts under 200 words (child-seat, tanjung-rhu, kilim, ferry, monsoon, hotel-delivery).

### Duplicate / overlapping clusters
- Requirements post vs pillar guide
- Airport vs ferry jetty posts (same template)
- Pantai Cenang vs Kuah town location guides
- Hotel delivery vs pickup posts

### Title mismatches
- “7 Ways to Save” → only 5 tips
- “10 Tips for Tourists” → 3 sections

---

## On-Page SEO

**Score: 55/100**

### Homepage (`/`)
- **Title:** `Car Rental in Langkawi | Book Online · Car XQ` ✅
- **H1:** “Rent a Car in Langkawi for Every Adventure.” ✅
- **Meta description:** present ✅
- **Missing:** `og:image`, `twitter:card`

### Guide pages
All four sitemap-listed guides: **no title, description, canonical, OG**

### Blog
- Per-post titles, descriptions, canonicals, `og:image` ✅
- Blog index missing `og:image`, `og:description`
- No internal links in blog body text
- Pillar does not link to supporting posts

### Brand inconsistency
- About page uses “XQ Car Rental”; homepage/schema use “Car XQ”

---

## Schema & Structured Data

**Score: 50/100**

### Implemented
- Homepage: `AutoRental`, `WebSite`, `FAQPage` (`src/lib/seo-home-schema.ts`)
- Blog: `BlogPosting` (`src/components/blog/BlogPostPage.tsx`)

### Critical validation issues
1. `sameAs`: `https://www.facebook.com/`, `https://www.instagram.com/` (placeholders)
2. `aggregateRating`: 4.9 / 980 — not substantiated on-page

### High-priority gaps
- Homepage missing `og:image`
- Blog author `@type: Organization` should be `Person`
- No `Product`/`Offer` schema on `/book/$carId`
- No `BreadcrumbList` on blog or legal pages
- `PostalAddress` missing `streetAddress` (available in `src/lib/legal/company.ts`)
- `image` on AutoRental duplicates logo — should use fleet/location photo

### Info
- `FAQPage` rich results restricted for commercial sites since Aug 2023 — still useful for AI citations.

---

## Performance (Core Web Vitals)

**Score: 65/100** (lab/codebase estimate — no CrUX or PageSpeed API credentials)

### Strengths
- SSR reduces blank-HTML risk for LCP element.
- Image lazy-loading on fleet cards and reels.
- Local hero/car images in `/public/image/` (no hotlink dependency for core UI).

### Concerns
- `CxqLandingPage` server chunk ~150 KB — large landing bundle.
- Many `<link rel="preload">` car images on homepage HTML (observed on legacy live fetch).
- TanStack devtools imported unconditionally in `__root.tsx`.
- No `netlify.toml` cache/security header tuning.
- Blog hero images use Unsplash CDN (third-party LCP risk on blog posts).

**Recommendation:** Run PageSpeed Insights after carxq.com is live; set `GOOGLE_API_KEY` for field CrUX data.

---

## Images

**Score: 72/100**

### Strengths
- Fleet card images use descriptive alt text (`{make} {model} – car rental Langkawi`).
- OG images configured on blog posts.

### Issues
- Reel avatar: `alt=""` (decorative — acceptable but car thumb could be descriptive).
- Homepage / about / blog index: no default share image meta.
- Some blog heroes are external Unsplash URLs — prefer self-hosted WebP for CWV + ownership.
- Large PNG/JPG assets in `/public/image/` — WebP/AVIF conversion would help LCP.

---

## AI Search Readiness (GEO)

**Score: 55/100**

### Strengths
- `public/llms.txt` exists with book links, 6 blog posts, guides, policies.
- AI crawlers explicitly allowed in robots.txt (GPTBot, ClaudeBot, PerplexityBot, Google-Extended).
- FAQ schema + local phone/area served in JSON-LD.
- Strong citability in guide components (know-how, pickup-return).

### Gaps
- `/about` missing from llms.txt (richest E-E-A-T page).
- Only 6 of 20 blog posts listed in llms.txt.
- Lead paragraphs ~40–80 words; AI citation sweet spot ~134–167 words.
- No `OAI-SearchBot` rule in robots.txt.
- Private routes not blocked from AI crawlers.
- Video reels not on YouTube (high AI citation correlation).

---

## Sitemap vs Routes

| In sitemap | Has meta | Notes |
|------------|----------|-------|
| `/` | ✅ | Missing og:image |
| `/about` | ✅ | Brand name inconsistency |
| `/blog` + 20 posts | ✅ | Thin content |
| 4× `/guides/*` | ❌ | Critical gap |
| Legal (5) | ✅ | No og:image |
| `/login`, `/register` | partial | Should noindex / remove from sitemap |

**Not in sitemap (correct):** `/admin/*`, `/account/*`, `/checkout/*`, `/book/*`

---

## Local SEO (Langkawi car rental)

**Score: 58/100**

- Strong: airport Door 3, jetty, hotel delivery copy; geo coordinates in schema; llms.txt contact block.
- Missing: full street address in schema; verified Google Business Profile link; local review source tied to schema; location landing pages beyond blog (e.g. dedicated `/langkawi-airport-car-rental` URL optional).

---

## Priority Action Plan

See `ACTION-PLAN.md` for the full prioritized checklist.

---

## Recommended measurement setup (post-launch)

1. Google Search Console for `carxq.com`
2. GA4 organic traffic segment
3. PageSpeed Insights / CrUX monitoring
4. IndexNow for Bing/Yandex
5. Monthly review of pillar + top 5 money keywords: `car rental langkawi`, `langkawi car rental`, `langkawi airport car rental`, `cheap car rental langkawi`, `rent a car langkawi`

---

*Audit performed on codebase at `/Users/rl/xq-car-fleet-v2` with live fetch of car.xqholidays.com.my (legacy). Re-run live crawl when carxq.com DNS is active.*
