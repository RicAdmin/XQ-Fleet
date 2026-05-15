# iPay88 Payment Integration + Season-Based Pricing Plan

**Date:** 2026-05-15  
**Scope:** Payment gateway integration with iPay88, season calendar seeding, and v2 pricing logic  
**Spec refs:** `pricing_logic_spec_v2.md`, `IPAY88_INTEGRATION.md`, `Season.csv`, `Car.csv`

---

## Decisions Made

| # | Decision | Choice |
|---|---|---|
| 1 | Car pricing schema | Add columns directly to `cars` table |
| 2 | Rental breakdown | Add columns directly to `rentals` table |
| 3 | Payment audit | Enrich `payments` table (no separate log table) |
| 4 | Cancellation policy | Deferred — build after payment is live |
| 5 | Late return detection | Option 1 — full timestamp comparison (production-safe) |
| 6 | Delivery fee | Charge both pickup AND return legs (spec default) |
| 7 | Coupon codes | Build now — add `promos` table |
| 8 | Seed strategy | Destructive DEMO* re-seed |

---

## Schema Changes

### `cars` table — add columns
```
priceLowSeasonSen        integer  not null default 0
pricePeakSeasonSen       integer  not null default 0
priceSuperPeakSeasonSen  integer  not null default 0
extHourLowSen            integer  not null default 0
extHourPeakAndSuperPeakSen integer not null default 0
deliveryFeeAirportSen    integer  not null default 0
deliveryFeeHotelSen      integer  not null default 0
minRentalDays            integer  not null default 1
maxRentalDays            integer  not null default 30
availableForBooking      boolean  not null default true
```

### `rentals` table — add booking detail + pricing breakdown columns
```
pickUpTime     text (HH:MM:SS, nullable)
returnTime     text (HH:MM:SS, nullable)
pickUpLocation text (nullable)
returnLocation text (nullable)
childSeat      boolean not null default false
secondDriver   boolean not null default false
couponCode     text (nullable)
baseRentalSen        integer not null default 0
extraHoursDecimal    numeric(10,4) not null default 0   -- fractional hours
extraChargeSen       integer not null default 0
extraRule            text not null default 'none'        -- 'none'|'hourly'|'full-day-cap'
addonsTotalSen       integer not null default 0
deliveryFeeSen       integer not null default 0
discountPercent      numeric(5,2) not null default 0
discountAmountSen    integer not null default 0
subTotalSen          integer not null default 0
```
> `totalAmountSen` (existing) = Final_Total (after discount, rounded)

### `payments` table — add iPay88 enrichment columns
```
rawResponse      jsonb (nullable)
ipay88TransId    text (nullable)
ipay88AuthCode   text (nullable)
callbackSource   text (nullable)  -- 'response' | 'callback'
```

### New `season_calendar` table (`src/db/schema/pricing.ts`)
```
id         serial primary key
fromDate   date not null
toDate     date not null
seasonType season_type_enum not null   -- 'Low' | 'Peak' | 'Super Peak'
```
Unique constraint: no overlapping date ranges enforced at app layer.

### New `promos` table (`src/db/schema/pricing.ts`)
```
id         uuid primary key default random()
title      text unique not null   -- the coupon code (stored uppercase)
discount   numeric(5,2) not null  -- percentage e.g. 10.00
usageLeft  integer not null default 0
createdAt  timestamp with timezone not null default now()
updatedAt  timestamp with timezone not null default now()
```

---

## New Files

| File | Purpose |
|---|---|
| `src/db/schema/pricing.ts` | `season_calendar` + `promos` tables + enums |
| `src/lib/pricing-logic.ts` | Pure pricing functions: getRentalDays, calculateBaseRental, calculateExtraHours, calculateAddons, calculateDeliveryFee, applyCoupon, computeFinalTotal |
| `src/lib/pricing-logic.test.ts` | Vitest unit tests — all 32 cases from spec §15 |
| `scripts/seed-season-from-csv.ts` | Seeds Season.csv → season_calendar table |

---

## Modified Files

| File | What changes |
|---|---|
| `src/db/schema/fleet.ts` | Add columns to `cars`, `rentals`, `payments` tables |
| `src/db/schema.ts` | Export from `./schema/pricing` |
| `scripts/seed-cars-from-csv.ts` | Read all pricing columns from Car.csv, store in new car columns |
| `src/routes/api/webhooks/ipay88.ts` | Store rawResponse, ipay88TransId, ipay88AuthCode, callbackSource on payment record |
| `package.json` | Add `"db:seed-season": "tsx scripts/seed-season-from-csv.ts"` script |

---

## Pricing Logic Summary (from spec v2)

```
SubTotal     = baseRental + extraCharge + addonsTotal + deliveryFee
discountAmt  = SubTotal × (discountPercent / 100)
finalTotal   = round(SubTotal − discountAmt)
```

- **Season lookup**: walk pickup→return dates (return day excluded), each day gets Low/Peak/Super Peak from season_calendar
- **Extra hours**: Option 1 (full timestamp). If extraMs > 0 and < 6 hours → hourly rate. If ≥ 6 hours → full-day cap (ceil(hours/24) × dayRate)
- **Last-day rule**: hourly rate and cap day rate use the last billing day's season
- **Delivery**: `fee(pickUpLoc) + fee(returnLoc)` where Airport=airportFee, Hotel=hotelFee, Jetty=airportFee, Office=0
- **Coupon**: case-insensitive match on `promos.title`, check `usageLeft > 0`; decrement atomically on booking commit

---

## Verifiable Goals (Stage 4 pass criteria)

1. ✅ `pnpm db:generate && pnpm db:migrate` completes without errors
2. ✅ `pnpm db:seed` populates all 17 cars with season pricing columns (non-zero values)
3. ✅ `pnpm db:seed-season` inserts exactly 35 season ranges covering all of 2026 with no gaps
4. ✅ `pnpm test` passes all 32 pricing-logic unit test cases from spec §15
5. ✅ iPay88 webhook stores `rawResponse` + `callbackSource` on the payment row after processing

---

## Implementation Order

1. [x] Schema: add columns to `cars`, `rentals`, `payments` in `fleet.ts`
2. [x] Schema: create `src/db/schema/pricing.ts` (season_calendar + promos)
3. [x] Schema: export pricing from `schema.ts`
4. [x] Migration: `pnpm db:push` (applied via push since journal was empty)
5. [x] Pricing logic: create `src/lib/pricing-logic.ts` (pure functions)
6. [x] Tests: create `src/lib/pricing-logic.test.ts` (32 cases)
7. [x] Run tests: `pnpm test` — 35/35 passed
8. [x] Seed cars: update `seed-cars-from-csv.ts` to read pricing columns
9. [x] Seed season: create `seed-season-from-csv.ts`
10. [x] package.json: add `db:seed-season` script
11. [x] Webhook: update `ipay88.ts` to store rawResponse + callbackSource
12. [x] Run seeds: `pnpm db:seed` (17 cars) + `pnpm db:seed-season` (35 ranges)
