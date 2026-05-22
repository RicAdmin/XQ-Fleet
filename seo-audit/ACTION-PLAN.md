# Car XQ — SEO Action Plan

Prioritized fixes to improve rankings for **car rental langkawi** and related terms.

**Status:** Code fixes shipped 22 May 2026. Deploy checklist items (#1 Netlify env) remain manual.

---

## Critical — fix before / at launch

| # | Action | Status | Files |
|---|--------|--------|-------|
| 1 | Set **`SITE_URL=https://carxq.com`** on Netlify (and verify `BETTER_AUTH_URL` matches) | ⏳ Deploy | Netlify env, `.env.example` |
| 2 | **Remove or fix `aggregateRating`** in homepage JSON-LD | ✅ Done | `src/lib/seo-home-schema.ts` |
| 3 | **Fix or remove `sameAs`** placeholder social URLs | ✅ Done (removed) | `src/lib/seo-home-schema.ts` |
| 4 | Add **`head()`** to all 4 guide routes | ✅ Done | `src/routes/guides/*.tsx` |
| 5 | **Expand pillar blog post** to 1,500+ words with internal links | ⏳ Backlog | `src/lib/blog/posts.ts` |

---

## High — week 1

| # | Action | Status | Files |
|---|--------|--------|-------|
| 6 | Add **`og:image` + `twitter:card`** to homepage | ✅ Done | `src/routes/index.tsx` |
| 7 | Update **`robots.txt`**: Disallow private routes + `OAI-SearchBot` | ✅ Done | `public/robots.txt` |
| 8 | Remove **`/login` and `/register`** from sitemap | ✅ Done | `public/sitemap.xml` |
| 9 | Create **`netlify.toml`** with security + cache headers | ✅ Done | `netlify.toml` |
| 10 | Expand **6 thinnest blog posts** | ⏳ Backlog | `src/lib/blog/posts.ts` |
| 11 | Add **`<lastmod>`** to sitemap from blog `updatedAt` | ✅ Done | `scripts/generate-sitemap.ts` |
| 12 | Fix blog **`author` schema** to `@type: Person` | ✅ Done | `src/components/blog/BlogPostPage.tsx` |
| 13 | Add **`streetAddress`** to AutoRental schema | ✅ Done | `src/lib/seo-home-schema.ts` |

Run after blog changes: `npm run sitemap:generate`

---

## Medium — month 1

| # | Action | Status | Files |
|---|--------|--------|-------|
| 14 | Add **`og:image`** to about, blog index, legal pages | ✅ Done | route `head()` blocks |
| 15 | Add **`Product` + `Offer` schema** on `/book/$carId` | ⏳ Backlog | `src/routes/book/$carId.tsx` |
| 16 | Add **`BreadcrumbList`** to blog posts | ✅ Done | `BlogPostPage.tsx` |
| 17 | **Internal linking** in blog bodies | ⏳ Backlog | `src/lib/blog/posts.ts` |
| 18 | Expand **`llms.txt`** | ✅ Done | `public/llms.txt` |
| 19 | Rewrite blog **lead paragraphs** for AI citability | ⏳ Backlog | `src/lib/blog/posts.ts` |
| 20 | Standardize brand to **“Car XQ”** in titles | ✅ Done | `about.tsx`, guides |
| 21 | Lazy-load **TanStack devtools** in dev only | ✅ Done | `src/routes/__root.tsx` |
| 22 | Fix title/content mismatches (7 tips / 10 tips) | ⏳ Backlog | blog posts |
| 23 | Self-host blog hero images as WebP | ⏳ Backlog | `public/image/blog/` |
| 24 | Named **blog author** with link to `/about` | ✅ Partial | Person schema + `/about` URL |

---

## Low — backlog

Unchanged — see prior version for items 25–30.

---

## New shared utilities

- `src/lib/seo-meta.ts` — OG image helpers, breadcrumb schema
- `npm run sitemap:generate` — regenerates `public/sitemap.xml` (32 URLs, with `lastmod`)

---

## Test plan after deploy

- [ ] Rich Results Test on homepage JSON-LD (no errors)
- [ ] View-source on `/guides/know-how` shows unique title + canonical
- [ ] Facebook/WhatsApp share preview shows image on homepage
- [ ] `robots.txt` blocks `/admin`
- [ ] GSC property verified for carxq.com
- [ ] Sitemap submitted in GSC; no `/login` entries
- [ ] llms.txt accessible at `https://carxq.com/llms.txt`
