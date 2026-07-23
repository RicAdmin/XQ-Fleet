# MS operational cluster brief — gaps, queue, and production order

- Package: [#47](https://github.com/kenlck/xq-car-fleet-v2/issues/47)
- Thesis: [#43](https://github.com/kenlck/xq-car-fleet-v2/issues/43) / [SEO-STRATEGY.md](../../SEO-STRATEGY.md) initiative **I3**
- Archetype: Evidence/brief
- Prepared: 2026-07-23
- Downstream: MS production package (requires this brief **and** EN brief [#46](https://github.com/kenlck/xq-car-fleet-v2/issues/46) before hardening live MS pages)

## Decision this brief enables

Ship native Malay operational-intent pages for airport, jetty, documents, cheap tips, and car-vs-Grab (plus optional insurance) without thin machine-translation duplicates, with publishing-queue priority ahead of destination MS/ZH rotation until the primary MS cluster is live.

## Source ledger

| Source | Accessed | Used for |
| --- | --- | --- |
| `content/blog/*.md` | 2026-07-23 | Live MS/EN cluster inventory, slugs, internal links |
| `plans/blog/*-ms.md` | 2026-07-23 | Planned MS ops posts and plan status |
| `plans/blog/PUBLISHING_QUEUE.md` | 2026-07-23 | Current queue positions |
| `SEO-STRATEGY.md` I3 | 2026-07-23 | Cluster scope and completion evidence |
| `seo-strategy/research/2026-07-24-discover-langkawi-car-rental.md` | 2026-07-23 | MS SERP demand (`sewa kereta Langkawi`) |
| `src/lib/blog/markdown.ts`, `src/lib/seo-locale-meta.ts` | 2026-07-23 | Slug suffix rules, hreflang behaviour |
| Issue #46 body (EN cluster URL list) | 2026-07-23 | EN source URLs for parity mapping |

**Limitations:** Live production deploy may lag in-repo content. EN cluster hardening rubric from #46 is not yet delivered; MS production should not treat EN copy refresh as an automatic translation source. Blog index and related-post modules do not filter by `language` today — MS posts appear on `/en/blog` until engineering changes that (out of scope for this brief).

---

## 1. MS cluster intent table

Primary operational cluster aligned to strategy I3 and EN cluster URLs from #46. Status reflects repo state on 2026-07-23.

| Intent | MS status | MS path / slug | Source EN URL | Notes |
| --- | --- | --- | --- | --- |
| Airport Door 3 pickup | **Live** | `/ms/blog/langkawi-airport-car-rental-pickup-ms` | `/en/blog/langkawi-airport-car-rental-pickup` | Native MS article live; harden after EN brief rubric ships |
| Kuah ferry jetty pickup | **Live** | `/ms/blog/langkawi-ferry-jetty-car-rental-ms` | `/en/blog/langkawi-ferry-jetty-car-rental` | Published 2026-07-23; body still links to EN requirements URL — fix when MS requirements ships |
| Documents / requirements / IDP | **Planned** | `/ms/blog/rent-a-car-langkawi-requirements-ms` | `/en/blog/rent-a-car-langkawi-requirements` | Plan `plans/blog/rent-a-car-langkawi-requirements-ms.md` status `pending`; queue #1 |
| Cheap rental tips | **Planned** | `/ms/blog/cheap-car-rental-langkawi-tips-ms` | `/en/blog/cheap-car-rental-langkawi-tips` | Plan exists; queue #4 today |
| Car vs taxi vs Grab | **Planned** | `/ms/blog/langkawi-car-rental-vs-taxi-grab-ms` | `/en/blog/langkawi-car-rental-vs-taxi-grab` | Plan exists; queue #31 today — too far back for I3 |
| Rental insurance | **Missing** (optional) | `/ms/blog/langkawi-car-rental-insurance-ms` (proposed) | `/en/blog/langkawi-car-rental-insurance` | No plan file; ship only if capacity remains after core five |

### Supplementary (not primary cluster acceptance)

| Page | MS status | Path | Role |
| --- | --- | --- | --- |
| Complete guide hub | **Live** | `/ms/blog/car-rental-langkawi-complete-guide-ms` | Pillar hub for `sewa kereta langkawi`; cross-link into cluster, do not substitute for intent-specific URLs |
| Ferry cashback season | **Live** | `/ms/blog/langkawi-ferry-cashback-car-rental-ms` | Secondary bet (I5); keep linked from jetty MS, not counted toward I3 parity evidence |

---

## 2. Recommended production order

Produce **native MS rewrites** (blog-writer skill), not EN paste or MT-only output.

| Order | Work item | Rationale |
| --- | --- | --- |
| 1 | `rent-a-car-langkawi-requirements-ms` | Unblocks correct MS internal links from live jetty-ms; highest document-intent gap |
| 2 | `cheap-car-rental-langkawi-tips-ms` | Strong domestic commercial query (`sewa kereta murah langkawi`); pairs with pricing season calendar |
| 3 | `langkawi-car-rental-vs-taxi-grab-ms` | Domestic transport comparison; completes cost-decision path with cheap tips |
| 4 | `langkawi-car-rental-insurance-ms` *(optional)* | Closes insurance intent; defer if writer capacity tight — EN insurance already live |
| 5 | Harden live `langkawi-airport-car-rental-pickup-ms` | Apply EN brief (#46) proof/citation/link rubric in native MS |
| 6 | Harden live `langkawi-ferry-jetty-car-rental-ms` | Fix EN requirements link → MS requirements; align meet-window/proof with EN brief |
| 7 | Cross-link `car-rental-langkawi-complete-guide-ms` | Add explicit links to all six cluster MS URLs + book CTA paths |

**Pause rule:** After order items 1–3 ship, do not insert non-cluster MS/ZH destination posts until item 4 resolves (write insurance or explicitly skip with issue comment).

---

## 3. Non-goals

- **No thin MT-only pages** — each MS ops post must be a native rewrite with MS query language in title/H1, answer-first opening, and locally natural examples (RM, musim rendah/puncak, MyKad, domestic ferry paths).
- **No auto-translation of EN cluster refreshes** from #46 — MS hardening follows the same rubric dimensions, not the same sentences.
- **No destination-itinerary MS expansion** — Kilim, sky bridge, duty-free, waterfall, etc. stay in the general queue; they do not satisfy I3.
- **No new head-term microsites or slug experiments** — use established `-ms` filename suffix convention (`content/blog/<slug>-ms.md`, `language: ms`).
- **No hreflang engineering** in this package — per-locale slug pairing is not implemented; use explicit `/ms/blog/...` and `/en/blog/...` internal links in article bodies until an engineering handoff adds translation pairs.

---

## 4. Hreflang and locale expectations

| Rule | Expectation |
| --- | --- |
| URL pattern | EN: `/{en}/blog/{slug}` (no language suffix). MS: `/{ms}/blog/{slug}-ms`. |
| Filename ↔ language | Enforced at build: MS files must end `-ms.md` with `language: ms` ([markdown.ts](../../src/lib/blog/markdown.ts)). |
| hreflang tags | `seoMeta` emits `en`, `ms`, `zh-Hans`, and `x-default` for the **same** `/blog/{slug}` path on each post — alternates do **not** map EN↔MS slug pairs today. |
| Blog index | `/ms/blog` currently lists all languages; MS cluster visibility still depends on publishing live `-ms` slugs and linking from MS home/guides. |
| Internal linking | Production must add reciprocal EN↔MS links in cluster bodies (e.g. airport EN footer → airport MS) using full locale paths. |
| Sitemap | New MS cluster URLs must appear in sitemap after publish (existing site pipeline). |

---

## 5. Queue change list (for production package to apply)

Apply to `plans/blog/PUBLISHING_QUEUE.md` when executing MS production — **do not apply in this brief package**.

| Action | Entry | Current position | Proposed position |
| --- | --- | --- | --- |
| Keep | `rent-a-car-langkawi-requirements-ms` | 1 | 1 |
| Move up | `cheap-car-rental-langkawi-tips-ms` | 4 | 2 |
| Move up | `langkawi-car-rental-vs-taxi-grab-ms` | 31 | 3 |
| Add plan + slot *(optional)* | `langkawi-car-rental-insurance-ms` | — | 4 (create `plans/blog/langkawi-car-rental-insurance-ms.md` first) |
| Defer | `driving-langkawi-first-time-zh` | 2 | 5 (after ops batch head) |
| Defer | `oku-friendly-car-rental-langkawi` | 3 | 6 |
| Unchanged | Remaining entries | 5+ | Renumber after inserts; preserve EN→MS→ZH rotation within non-cluster tail |

**Rotation note:** Temporarily batch the three planned MS ops posts (requirements, cheap tips, car-vs-Grab) before the next ZH destination post so I3 parity is not blocked behind `driving-langkawi-first-time-zh`.

---

## 6. Production acceptance rubric (verify per MS URL)

Downstream production can mark each MS cluster URL complete when all rows pass:

| Criterion | Verification |
| --- | --- |
| Live at proposed `/ms/blog/{slug}-ms` | File exists in `content/blog/`, build passes, page returns 200 |
| Native MS intent | Title/H1 target MS query from plan `primaryQuery`; no English-only H2 blocks |
| Answer-first opening | First paragraph states the decision/outcome in Malay |
| Cluster cross-links | Links to ≥2 other MS cluster URLs + book/checkout path on `car.xqholidays.com.my` |
| EN counterpart link | Footer or “Versi English” link to mapped EN URL |
| Factual parity | Deposit, age, Door 3 / jetty meet, season rates match EN source and XQ ops facts |
| No thin duplicate | Word count and section depth within ~80–120% of EN counterpart; not a single-block MT dump |
| Plan status | Corresponding `plans/blog/*-ms.md` marked `complete` with `output:` path |

---

## 7. Assumptions and open items

- EN brief [#46](https://github.com/kenlck/xq-car-fleet-v2/issues/46) will supply citation/proof checklist for hardening live MS airport and jetty pages.
- Insurance MS is optional per strategy; skipping it does not block I3 review if the five core intents are live.
- Blog language filtering on index/related posts may warrant a future engineering handoff — not required for this brief.
