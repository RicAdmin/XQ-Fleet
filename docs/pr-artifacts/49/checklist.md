# Issue #49 — EN ops cluster hardening checklist

Brief oracle: [seo-strategy/briefs/en-ops-cluster-hardening.md](../../seo-strategy/briefs/en-ops-cluster-hardening.md) §4

**Verified:** 2026-07-24 (automated `en-ops-cluster-hardening.test.ts` + link crawl)

## Delivery acceptance

| Criterion | Pass | Evidence |
| --- | --- | --- |
| Six posts updated per brief rubric | ✅ | `content/blog/*.md` (six cluster files) |
| Internal links from §2.1 map applied | ✅ | Each post ≥4 cluster outbound links; booking-dock CTA on all six |
| PR with checklist evidence | ✅ | This file + unit tests |

## Global rubric (G1–G7)

| # | Criterion | Pass |
| --- | --- | --- |
| G1 | Answer-first opening | ✅ |
| G2 | metaTitle/H1 intent preserved | ✅ |
| G3 | ≥4 cluster outbound links | ✅ |
| G4 | In-body `/en#booking-dock` | ✅ |
| G5 | Blog CTA template unchanged | ✅ (no template edits) |
| G6 | No new URLs; EN scope only | ✅ |
| G7 | `updatedAt` 2026-07-24; dated RM claims stamped | ✅ |

## URL-specific (sample)

| URL | Key checks | Pass |
| --- | --- | --- |
| airport | Door 3 left, flight number, 30 min return, text proof fallback | ✅ |
| jetty | Ferry ETA, not-24/7 caveat, ferry origins, cashback cross-link only | ✅ |
| requirements | Checklist before table, JPJ citation, card deposit | ✅ |
| insurance | TPL + CDW conditional, excess, agreement link | ✅ |
| cheap tips | Direct book, season RM, no weekly %, free meets | ✅ |
| vs-grab | Decision rule opening, indicative disclaimer | ✅ |

## Limitations

- Door 3 / jetty proof photos not added (text + landmark fallback per brief §3.2)
- Pillar/guide inbound links (brief §2.2) not in this PR — cluster mutual graph only
- No rankings, traffic, or conversion outcomes claimed
