# Organic landing → conversion join (GA4)

How to attribute or segment organic landings on operational cluster and blog URLs to checkout-start (`begin_checkout`) and paid-booking (`purchase`) events. Part of the I1 measurement foundation ([#45](https://github.com/kenlck/xq-car-fleet-v2/issues/45) engineering handoff). Event names and fire points: [measurement-conversion-events.md](measurement-conversion-events.md).

## Preferred method — same-session funnel in GA4

Use GA4 **Explorations** (Funnel exploration) or **standard reports** filtered to organic search. No UTMs are required for organic SEO; GA4 assigns **Default Channel Group = Organic Search** from referrer and Google signals.

### 1. Define ops/blog landing pages

Filter landing `page_view` events where `page_path` matches operational cluster or blog URLs:

| Cluster | Path patterns (any locale prefix `/{en,ms,zh}`) |
| --- | --- |
| Trip guides | `/guides/pick-car`, `/guides/pickup-return`, `/guides/plan-drive`, `/guides/know-how` |
| Blog | `/blog/` (all posts under `/$locale/blog/$slug`) |
| About (optional context) | `/about` |

Examples: `/en/guides/pickup-return`, `/ms/blog/langkawi-airport-car-rental-pickup`.

### 2. Same-session path

Within a **session**, require this ordered path (open funnel — steps may have intermediate pages):

1. **Landing** — first `page_view` in the session on an ops/blog path (step 1 filter above).
2. **Checkout start** — `begin_checkout` (fires when a valid public checkout session mounts; see conversion contract).
3. **Paid booking** — `purchase` (`transaction_id` = rental UUID).

Segment the exploration or report by:

- **Session default channel group** = `Organic Search`, **or**
- **Session source / medium** matching organic (e.g. `google / organic`).

This join is **session-scoped**: a user who lands organically on an ops URL in the same browser session and later completes checkout counts toward organic→conversion for that session.

### 3. GA4 UI shortcuts

**Funnel exploration (recommended)**

1. Explore → Funnel exploration.
2. Steps: (a) `page_view` with `page_path` regex or contains filter for `/guides/` or `/blog/`; (b) `begin_checkout`; (c) `purchase`.
3. Segment: Session default channel group = Organic Search.
4. Breakdown: `page_path` on step 1 to see which ops/blog URLs drive the funnel.

**Standard reports**

- **Traffic acquisition** → filter Organic Search → use **Pages and screens** for landing URLs, then cross-check **Events** for `begin_checkout` and `purchase` counts in the same date range (less precise than a funnel, but sufficient for spot-checks).

**Durable paid join (analytics ↔ database)**

`purchase.transaction_id` maps to `rentals.id` after iPay88 success. Use this to reconcile GA4 conversions with `paymentStatus = 'paid'` when volumes are low or client events are blocked.

## Limitations

The method is intentionally imperfect; treat results as directional, not exact multi-touch attribution.

| Limitation | Effect |
| --- | --- |
| **Same-session only** | User reads an ops post, leaves, returns via direct/bookmark or different device → landing is not credited to organic. |
| **Cross-device** | Research on phone, book on desktop (or vice versa) breaks the session join. |
| **Cleared storage / ITP** | Cookie or storage clearing between landing and checkout starts a new session or drops client identity. |
| **Ad blockers / consent** | Some browsers block `gtag`; `purchase` may be missing while server `rentals` row is still paid — use DB reconciliation. |
| **Low volume** | Early-stage sites may see single-digit weekly funnels; prefer longer date ranges and week-over-week trends over daily noise. |
| **No paid-channel split in this doc** | Organic segment relies on GA4 channel grouping; paid/social/email need separate segments. |

UTMs are **not** required for organic SEO landings; do not require campaign tags on ops/blog URLs for this join.

## Validation

Prove events fire and can be filtered to ops landing paths before relying on production funnels.

### Staging / local test plan

Prerequisites: `VITE_GA_MEASUREMENT_ID` set to a GA4 property (use a dev/staging stream or production with DebugView). Local: `.env.local` + `pnpm dev`.

1. **Landing `page_view`** — Open an ops URL (e.g. `http://localhost:3000/en/guides/pickup-return`). In browser DevTools → Network, confirm `collect`/`g/collect` requests include `en=page_view` and `ep.page_path` containing `/guides/pickup-return`. In GA4 **DebugView**, see `page_view` for that path.
2. **`begin_checkout`** — From homepage, pick dates and a car, open checkout (`/en/checkout/$carId` with complete trip). DebugView should show `begin_checkout` with `item_id` (car id). Remounting the same checkout should not duplicate (client dedupe).
3. **`purchase`** — Complete a test booking through iPay88 sandbox (or mock confirmed return URL with `?payment=response` on `/en/checkout/confirmed/$rentalId`). DebugView should show `purchase` with `transaction_id` matching the rental UUID. Repeat visit to confirmation should not duplicate.

Optional automated check: `pnpm test src/lib/ga.test.ts` (unit coverage for event helpers and dedupe).

### Production spot-check

1. GA4 → **Configure** → **DebugView** — temporarily enable debug mode on a test device (`gtag` debug or Tag Assistant), or use **Realtime** during a controlled test booking.
2. Run the same three-step journey on `https://car.xqholidays.com.my` starting from a live ops URL (e.g. `/en/blog/langkawi-airport-car-rental-pickup`).
3. In **Realtime** or **DebugView**, confirm all three event names appear in one session.
4. After 24–48 hours, open a **Funnel exploration** (7-day range) with Organic Search segment and ops/blog step-1 filter; confirm non-zero `begin_checkout` / `purchase` if test traffic was the only source, or compare to known booking days.

GSC impression/click baselines for ops URLs are tracked separately ([#48](https://github.com/kenlck/xq-car-fleet-v2/issues/48)); this doc covers analytics join only.

## Related

- [Conversion event contract](measurement-conversion-events.md) — event names, params, code paths
- [SEO-STRATEGY.md](../SEO-STRATEGY.md) — I1 measurement foundation initiative
- Engineering handoff: [issue #45](https://github.com/kenlck/xq-car-fleet-v2/issues/45)
