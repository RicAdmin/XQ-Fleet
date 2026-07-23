# Organic funnel definition and GSC baseline (I1)

**Package:** [#48](https://github.com/kenlck/xq-car-fleet-v2/issues/48)  
**Thesis:** [#43](https://github.com/kenlck/xq-car-fleet-v2/issues/43) — I1 Measurement foundation  
**Baseline date:** 2026-07-24 (UTC+8)  
**GSC property:** [https://car.xqholidays.com.my/](https://search.google.com/search-console?resource_id=https%3A%2F%2Fcar.xqholidays.com.my%2F) (verified 2026-07-24, [#44](https://github.com/kenlck/xq-car-fleet-v2/issues/44))

This note records the **organic → checkout start → paid booking** funnel stages, the **named operational URLs** in scope for the primary bet, and a **GSC impressions/clicks snapshot** at strategy baseline. GA4 same-session join detail lives in [docs/measurement-organic-funnel.md](../../docs/measurement-organic-funnel.md); conversion event contract in [docs/measurement-conversion-events.md](../../docs/measurement-conversion-events.md).

---

## 1. Funnel stages and data sources

| Stage | Definition | Primary data source | Fallback / reconciliation |
| --- | --- | --- | --- |
| **1 — Organic discovery** | User lands on an operational cluster or guide URL from organic search in a session | **GSC** Performance → Pages (impressions, clicks, CTR, avg position) for each named URL below; **GA4** landing `page_view` filtered to Default Channel Group = Organic Search | GSC only when GA4 is unavailable; note property is new and GSC may lag |
| **2 — Checkout start** | User opens a valid public checkout session | **GA4** event `begin_checkout` (fires on checkout mount; see conversion contract) | Admin rental reports filtered by `createdAt` in window — cannot attribute to organic landing without GA4 |
| **3 — Paid booking** | Rental completes with successful payment | **GA4** event `purchase` (`transaction_id` = rental UUID) | **Database** `rentals.paymentStatus = 'paid'` joined on `rentals.id`; use when client events are blocked |

**Attribution join (stages 1→3):** Same-session organic funnel in GA4 Explorations (landing on ops/guide/blog path → `begin_checkout` → `purchase`). See [measurement-organic-funnel.md](../../docs/measurement-organic-funnel.md). Cross-session and cross-device landings are **not** credited to organic in this method.

**Continue / adjust / stop** uses this baseline plus 90-day review rules in [SEO-STRATEGY.md](../../SEO-STRATEGY.md).

---

## 2. Measured operational URLs

URLs align with EN cluster brief ([#46](https://github.com/kenlck/xq-car-fleet-v2/issues/46)) and live MS cluster ([#47](https://github.com/kenlck/xq-car-fleet-v2/issues/47)). Paths are locale-prefixed on the live host.

### EN — primary cluster (blog)

| Intent | Path |
| --- | --- |
| Airport Door 3 pickup | `/en/blog/langkawi-airport-car-rental-pickup` |
| Kuah ferry jetty pickup | `/en/blog/langkawi-ferry-jetty-car-rental` |
| Documents / requirements | `/en/blog/rent-a-car-langkawi-requirements` |
| Rental insurance | `/en/blog/langkawi-car-rental-insurance` |
| Cheap rental tips | `/en/blog/cheap-car-rental-langkawi-tips` |
| Car vs taxi vs Grab | `/en/blog/langkawi-car-rental-vs-taxi-grab` |

### EN — trip guides (cluster support)

| Guide | Path |
| --- | --- |
| Pick a car | `/en/guides/pick-car` |
| Pickup & return | `/en/guides/pickup-return` |
| Plan your drive | `/en/guides/plan-drive` |
| Know-how | `/en/guides/know-how` |

### MS — live cluster (partial parity)

| Intent | Path | Notes |
| --- | --- | --- |
| Airport pickup | `/ms/blog/langkawi-airport-car-rental-pickup-ms` | Live |
| Jetty pickup | `/ms/blog/langkawi-ferry-jetty-car-rental-ms` | Live |
| Documents | `/ms/blog/rent-a-car-langkawi-requirements-ms` | **Not live** at baseline — excluded from MS table until published |
| Cheap tips | `/ms/blog/cheap-car-rental-langkawi-tips-ms` | **Not live** at baseline |
| vs Grab | `/ms/blog/langkawi-car-rental-vs-taxi-grab-ms` | **Not live** at baseline |
| Insurance | `/ms/blog/langkawi-car-rental-insurance-ms` | **Not live** at baseline |

### MS — trip guides (live)

| Guide | Path |
| --- | --- |
| Pick a car | `/ms/guides/pick-car` |
| Pickup & return | `/ms/guides/pickup-return` |
| Plan your drive | `/ms/guides/plan-drive` |
| Know-how | `/ms/guides/know-how` |

**Out of scope for this baseline table:** Pillar hub (`car-rental-langkawi-complete-guide`), destination/itinerary posts, ZH URLs, and seasonal cashback posts (tracked under secondary bet I5).

---

## 3. GSC snapshot

### Query parameters

| Field | Value |
| --- | --- |
| Property | URL-prefix `https://car.xqholidays.com.my/` |
| Report | Performance → Search results |
| Date range | Last **28 days** (GSC UI default at pull) |
| Search type | Web |
| Pulled | **2026-07-24** ~06:43 UTC+8 |
| Pulled by | Low Chin Kian (`kenlck1990@gmail.com`) via GSC UI |
| Evidence | [docs/pr-artifacts/48/gsc-performance-baseline.png](../../docs/pr-artifacts/48/gsc-performance-baseline.png) |

### Property-level totals (28 days)

| Clicks | Impressions | CTR | Avg position |
| ---: | ---: | ---: | ---: |
| 0 | 0 | — | — |

GSC displayed **“Processing data, please check again in a day or so”** and the Pages breakdown showed **No data**. This is expected: the URL-prefix property was verified the same day ([#44](https://github.com/kenlck/xq-car-fleet-v2/issues/44)); historical performance for retired host `carxq.com` does not carry over.

### Per-URL figures (EN cluster + guides)

All named EN URLs in §2: **0 clicks, 0 impressions** (no page-level rows in GSC at snapshot; property totals are zero).

| Path | Clicks | Impressions | Notes |
| --- | ---: | ---: | --- |
| `/en/blog/langkawi-airport-car-rental-pickup` | 0 | 0 | No page row; property processing |
| `/en/blog/langkawi-ferry-jetty-car-rental` | 0 | 0 | No page row; property processing |
| `/en/blog/rent-a-car-langkawi-requirements` | 0 | 0 | No page row; property processing |
| `/en/blog/langkawi-car-rental-insurance` | 0 | 0 | No page row; property processing |
| `/en/blog/cheap-car-rental-langkawi-tips` | 0 | 0 | No page row; property processing |
| `/en/blog/langkawi-car-rental-vs-taxi-grab` | 0 | 0 | No page row; property processing |
| `/en/guides/pick-car` | 0 | 0 | No page row; property processing |
| `/en/guides/pickup-return` | 0 | 0 | No page row; property processing |
| `/en/guides/plan-drive` | 0 | 0 | No page row; property processing |
| `/en/guides/know-how` | 0 | 0 | No page row; property processing |

### Per-URL figures (MS live)

| Path | Clicks | Impressions | Notes |
| --- | ---: | ---: | --- |
| `/ms/blog/langkawi-airport-car-rental-pickup-ms` | 0 | 0 | No page row; property processing |
| `/ms/blog/langkawi-ferry-jetty-car-rental-ms` | 0 | 0 | No page row; property processing |
| `/ms/guides/pick-car` | 0 | 0 | No page row; property processing |
| `/ms/guides/pickup-return` | 0 | 0 | No page row; property processing |
| `/ms/guides/plan-drive` | 0 | 0 | No page row; property processing |
| `/ms/guides/know-how` | 0 | 0 | No page row; property processing |

---

## 4. Gaps and limitations

| Gap | Effect | Mitigation |
| --- | --- | --- |
| **New GSC property** | Zero historical impressions/clicks at baseline | Re-pull Performance → Pages after ~48h and at I1 30-day review; update this file or add dated successor |
| **No per-URL GSC rows yet** | Cannot rank which ops URL leads discovery | Filter GSC Pages by path prefix `/en/blog/` and `/en/guides/` once data appears |
| **Same-session GA4 join** | Organic landings on one device/session only | Documented in [measurement-organic-funnel.md](../../docs/measurement-organic-funnel.md) |
| **MS cluster incomplete** | Only 2 of 6 MS ops posts live | MS table grows when [#50](https://github.com/kenlck/xq-car-fleet-v2/issues/50) ships; add rows without rewriting thesis |
| **Low volume** | Funnel steps may be single-digit weekly | Prefer 7–28 day GA4 windows and DB reconciliation for `purchase` |

---

## 5. Refresh procedure (30-day I1 review)

1. GSC → Performance → **Pages** → date range **28 days** → Export.
2. Filter export for paths in §2; paste updated table into a new dated baseline file or amend §3 with pull date.
3. GA4 → Funnel exploration (Organic Search segment, ops landing filter) — compare `begin_checkout` and `purchase` counts to baseline week.
4. Record pull actor and timestamp in the new file header.

---

## Related

- [SEO-STRATEGY.md](../../SEO-STRATEGY.md) — I1 initiative and continue/adjust/stop rules
- [docs/measurement-organic-funnel.md](../../docs/measurement-organic-funnel.md) — GA4 organic landing → conversion join
- [docs/measurement-conversion-events.md](../../docs/measurement-conversion-events.md) — `begin_checkout` / `purchase` contract
- [seo-strategy/briefs/en-ops-cluster-hardening.md](../briefs/en-ops-cluster-hardening.md) — EN URL inventory source
