# Bug Fix Log: Drizzle / pg bundled into browser (Buffer is not defined)

> Session date: 2026-03-24
> Questioning mode: Quick
> Severity: Critical — app throws on every page load in dev/prod
> Status: ✅ RESOLVED

---

## Investigation Findings

| # | Finding | Evidence |
|---|---|---|
| F1 | `postgres-bytea`, `pg-types`, and `pg` are being bundled into the browser bundle | Stack trace: `drizzle-orm_node-pos…s.js` in browser console |
| F2 | `src/db/index.ts` calls `drizzle()` at module load time (side effect) | `export const db = drizzle(process.env.DATABASE_URL!, { schema })` |
| F3 | `src/lib/auth-functions.ts` had `import { db } from '#/db'` and `import { auth } from '#/lib/auth'` at top-level | Static module-level imports |
| F4 | `src/lib/car-functions.ts` had `import { db } from '#/db'` at top-level | Static module-level imports |
| F5 | TanStack Start strips `createServerFn` handler **bodies** from client bundle, but does NOT remove module-level `import` statements | Verified by inspecting Vite-served bundles |
| F6 | Route files import from `auth-functions`/`car-functions`, causing Vite to eagerly load the entire module including `import { db }` | Browser requests `db/index.ts` → `drizzle-orm/node-postgres` → `pg` → `postgres-bytea` → `Buffer` crash |
| F7 | Project uses `createServerFn` (not `"use server"`) for server/client splitting | No `"use server"` directives anywhere in codebase |

### Root cause
`src/lib/auth-functions.ts` and `src/lib/car-functions.ts` imported `db` (and `auth`) at module top-level. Vite evaluates static imports eagerly in the browser, so even though `createServerFn` handler bodies are stripped, the top-level `import { db } from '#/db'` was still executed — pulling `drizzle-orm/node-postgres` → `pg` → `postgres-bytea` (which calls `Buffer`) into the browser bundle.

### Affected code paths
- All routes that import from `auth-functions.ts` or `car-functions.ts`
- Manifested as crash on every admin page load

### Reproduction
1. Run `pnpm dev`
2. Navigate to any admin/cars route
3. Browser console shows: `ReferenceError: Buffer is not defined` from `postgres-bytea/index.js`

---

## Fix Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Move `import { db }` and `import { auth }` from module top-level to inside each `createServerFn` handler using `await import(...)` | Dynamic imports are lazy — they only execute when called. Since handler bodies are stripped from client bundle, the `import('#/db')` inside them never runs in the browser. Minimal, surgical change. |
| D2 | Did NOT convert `route-guards.ts` to `createServerFn` | The route-guards functions call `getCurrentSession` (already a `createServerFn`), not `db` directly. No change needed there. |

### Alternatives considered and rejected
- **Add `db/index.ts` to `vite.config.ts` ssr.noExternal** — config-level workaround that hides the real issue; fragile if new Node-only deps are added
- **Convert `route-guards.ts` plain functions to `createServerFn`** — unnecessary since route-guards don't import `db` directly; over-engineering

### Regression risks
- Low: dynamic `import('#/db')` returns the same singleton `db` instance on each call (Node module cache), so no performance concern
- Low: all `createServerFn` handlers still call `db` correctly — only the import timing changed

---

## Resolution

**Files changed:**
- `src/lib/auth-functions.ts` — removed top-level `import { db }` and `import { auth }`. Added `const { db } = await import('#/db')` and `const { auth } = await import('#/lib/auth')` inside each handler that needs them.
- `src/lib/car-functions.ts` — removed top-level `import { db }`. Added `const { db } = await import('#/db')` inside each handler.

**Verified:** Browser-served bundle for `car-functions.ts` now contains only `createClientRpc` stubs — zero references to `drizzle`, `node-postgres`, `postgres-bytea`, or `/src/db`. No new TypeScript errors introduced (same 18 pre-existing errors).

---

## Open Questions (resolved)

- [x] Which import chain causes `drizzle-orm/node-postgres` to land in browser? — Top-level `import { db }` in `auth-functions.ts` and `car-functions.ts`
- [x] Does this project use `"use server"` directives? — No, uses `createServerFn` only
