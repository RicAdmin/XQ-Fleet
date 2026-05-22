# Admin Module — Routes, Roles, Env

This file documents the admin module added in `0006_admin_phase0_phase1.sql` and
the subsequent migrations for Phase 2 (promos) and Phase 3 (affiliates).

## Roles

The `user_role` enum has four values. Plan-spec names → DB values:

| Spec name     | DB role        | Notes                                                                     |
| ------------- | -------------- | ------------------------------------------------------------------------- |
| `SUPER_ADMIN` | `super_admin`  | Highest privilege. Currently equivalent to `owner` for most admin actions. |
| `ADMIN`       | `owner`        | Single owner of the fleet. Has full admin privileges.                     |
| `SUPPORT`     | `staff`        | Front-desk operational role. Can access `/admin/cars`, `/admin/rentals`, etc. |
| `CUSTOMER`    | `customer`     | Portal user. Cannot access `/admin/*`.                                    |

Existing `requireRole(['owner', 'staff'])` callers are unchanged. New admin
features use:

- `requireAdmin()` — `owner | super_admin`. Used for writes to promos, affiliates,
  cancel/refund/note actions, and the dashboard.
- `requireAdminAccess()` — guards `/admin/*` routes; throws `notFound()` (404)
  for non-admin visitors. Default `allow` covers `owner | staff | super_admin`.
- `requireFullAdminAccess()` — shortcut for `allow: ['owner', 'super_admin']`.

## Phase 1 — Operational Dashboard

Route: `/admin` (replaces the previous owner dashboard).

KPI grid (`getAdminDashboardKpis`):

1. Bookings today (rentals.created_at = today)
2. MTD revenue + MoM delta (rentals.paid_amount_sen where status='closed' and actual_return_date in this month)
3. Active rentals
4. Overdue rentals (status='active' AND end_date < today)
5. Pending refunds (refunds.status = 'requested')

Tabs:

- **Bookings** — server-paginated, filter by status / date range / search; per-page CSV + "export all" CSV.
- **Payments** — server-paginated, filter by status / date / search.
- **Cars** — read-only with lifetime closed-rental revenue + lifetime closed-rental count.

Row click opens the **Booking drawer** (`<BookingDrawer>`) with cancel /
request-refund / add-note actions. Each action writes an `audit_log` row.

## Schema additions

- `audit_log` — append-only history of admin writes. Indexed by entity_type+entity_id and actor.
- `refunds` — refund lifecycle tracker (`requested → approved → rejected → paid`).
- `rental_notes` — many internal notes per rental.

(Phase 2 adds `promos.code` + new columns + `promo_redemptions`. Phase 3 adds
`affiliates` and friends, plus rentals.affiliate_ref_code /
rentals.affiliate_attribution_id.)

## Phase 2 — Promo codes

Route: `/admin/promos`, `/admin/promos/$promoId`.

Schema highlights (`promos`):

- `code` (unique), `discount_type` (`percent` | `fixed`), `discount_value_sen`
- `max_redemptions`, `redemptions_used`, `per_user_limit`
- `min_booking_amount_sen`, `applicable_car_categories`, `starts_at`, `ends_at`
- `is_active`, `stackable_with_affiliate`
- Legacy `title` / `discount` / `usage_left` kept temporarily for compatibility.

Per-redemption history lives in `promo_redemptions`, keyed by `(promo_id, rental_id)`.

Server functions (`src/lib/promo-functions.ts`):

- `validatePromo({ code, cartContext })` — `{ valid, discountSen, reason? }`.
- `redeemPromoInTx(tx, …)` — atomic `UPDATE … WHERE redemptions_used < max_redemptions RETURNING id`; rolls back the booking transaction if the row is exhausted.
- `createPromo`, `updatePromo`, `deactivatePromo`, `bulkGeneratePromos`,
  `listPromos`, `getPromoDetail` — all audit-logged.

`createPortalBooking` is now wrapped in `db.transaction` and atomically:

1. Inserts the rental
2. Updates the car to `payment-pending`
3. Redeems any promo
4. Inserts the affiliate attribution (Phase 3)
5. Creates the pending payment
6. Records the audit row

## Phase 3 — Affiliates & Attribution

Routes:

- `/admin/affiliates` — list with lifetime stats (clicks, bookings, earned, paid).
- `/admin/affiliates/$affiliateId` — detail page with monthly SVG chart (`<MiniTimeSeriesChart>`), attributions table, payouts table.
- `/admin/affiliates/payouts` — earned-by-affiliate grouping with "Mark as paid" → creates a payout batch.
- `/r/$code` — short-link route that sets the `aff_ref` cookie and redirects to `/` (or `?dest=` if supplied).

Cookie:

- `aff_ref` — HttpOnly, `SameSite=Lax`, `Secure` in production, 30-day TTL.
- Last-click wins: any subsequent `?ref=CODE` overwrites the previous value.
- Capture happens in two places: the root `beforeLoad` (any page with `?ref=`) and the `/r/$code` short link.

Attribution lifecycle (`affiliate_attributions.status`):

- `pending` — created when the booking is made.
- `earned` — flipped when the rental closes (`returnRental` in `rental-functions.ts`).
- `voided` — flipped when the rental is cancelled (`cancelRental` and `cancelAdminBooking`).
- `paid` — flipped when an admin records a payout batch via `markPayoutBatchPaid`.

Commission math (`computeCommissionSen`):

- `percent` — `floor(paidAmountSen * pct / 100)`, clamped 0-100.
- `fixed` — capped at `paidAmountSen`.
- Default applied on the **post-discount** `totalAmountSen` (locked decision from plan §7.6).

Schema:

- `affiliates`, `affiliate_clicks`, `affiliate_attributions`, `affiliate_payout_batches`.
- `rentals.affiliate_ref_code` (snapshot) and `rentals.affiliate_attribution_id` (FK).

## Seed data

```
pnpm db:seed-admin
```

Seeds 3 sample promos (WELCOME10, RAYA50, WEEKEND15) and 3 sample affiliates
(`jane-travel`, `langkawi-hotel`, `sunset-tours`). Safe to re-run — uses
`ON CONFLICT DO NOTHING` against the code unique index.

## CSV exports

- `downloadCsv(filename, rows, headers?)` — client-side download.
- `<CsvDownloadButton>` — wraps an inline rows array or an async fetcher
  (used for "export all" tables).

## Env vars

No new env vars are required for Phase 0 / 1. The admin module piggybacks on
`BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and the existing `DATABASE_URL`.

## Audit log retention

Audit log rows include actor IP + UA. There is currently no automated retention.
If you need to comply with a data-retention policy, add a periodic cleanup job
against `audit_log.created_at`.

## Known follow-ups

- Existing pass-through `inputValidator` callers in `rental-functions.ts`,
  `report-functions.ts`, etc. are not retro-migrated to Zod. Tech-debt entry.
- The "export all" bookings CSV is currently capped at 5000 rows. A streaming
  endpoint can be added if exports regularly exceed that.
- Legacy promo columns `title`, `discount`, `usage_left` will be dropped in a
  follow-up migration once all read sites use `code` / `discount_type` /
  `discount_value_sen`.
- Phase 3: when an affiliate code is archived between click and booking, the
  attribution silently drops. The plan calls for logging this to `audit_log`;
  we currently rely on `findAffiliateByCode` returning null and skipping.
