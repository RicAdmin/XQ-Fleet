# Decisions: Car Inventory (Stage 2)

> Session date: 2026-03-24
> Questioning mode: Normal

---

## Technical Decisions

| # | Decision | Rationale | Stage |
|---|---|---|---|
| T1 | Add `dailyRate` (integer, sen) to `cars` table | Pre-fills rental creation; avoids re-entering common rates each time | Stage 1 |
| T2 | Shared route `/admin/cars` accessible to owner and staff | Avoids duplicating views; edit controls conditionally rendered by role | Stage 1 |
| T3 | Car color stored as enum (predefined list) | Ensures consistent data; avoids free-text inconsistencies (e.g. "white" vs "White" vs "Pearl White") | Stage 1 |

### Schema changes
- Add `dailyRate integer not null default 0` column to `cars` table
- Add `color` enum: `white`, `black`, `silver`, `grey`, `red`, `blue`, `dark-blue`, `maroon`, `gold`, `beige`, `green`, `other`

---

## Design Decisions

| # | Decision | Rationale | Stage |
|---|---|---|---|
| D1 | Car list uses a dense sortable table | Owner-primary desktop view; tables are fastest for scanning many records | Stage 1 |
| D2 | Status filter as tabs (All / Available / Rented / Reserved / Maintenance / Damaged / Retired) | Tabs give instant one-click filtering without losing context | Stage 1 |
| D4 | All DB calls use dynamic `await import('#/db')` inside `createServerFn` handlers instead of top-level imports | TanStack Start strips `createServerFn` handler bodies from the client bundle but NOT static module-level imports. A top-level `import { db }` causes `drizzle-orm/node-postgres` → `pg` → `postgres-bytea` (which uses Node.js `Buffer`) to be bundled into the browser, crashing with `Buffer is not defined`. Dynamic imports inside handler bodies are lazy and only execute server-side. |
| D5 | Same pattern applies to `import { auth } from '#/lib/auth'` — dynamic import inside handlers | `auth.ts` also imports `db` at module level. Moving to dynamic import breaks the entire Node.js dep chain from reaching the browser bundle. |
| D6 | `getRequestHeaders` from `@tanstack/react-start/server` must also be dynamically imported inside handler bodies | TanStack Start has an explicit `[import-protection]` rule that denies `@tanstack/react-start/server` in client environments. A static top-level import triggers this error even though the function is only called server-side. Dynamic import inside handler body is the fix. |

---

## Open Questions

- None

