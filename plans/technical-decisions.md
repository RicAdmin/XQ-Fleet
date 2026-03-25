# Technical Decisions Log

## Drizzle / Server Boundary

### All Drizzle calls must be inside `createServerFn` handlers
**Decision:** Any code that imports from `#/db` (Drizzle ORM or the `db` instance) must live inside a `createServerFn` handler, not at module top-level or in component code.

**Reason:** `drizzle-orm/node-postgres` pulls in the `pg` package which requires Node.js built-ins (`Buffer`, `net`, etc.) that are not available in the browser bundle. Vite will bundle anything imported at the top level of route/component files into the client chunk, causing `ReferenceError: Buffer is not defined` at runtime.

**Pattern (mandatory):**
```ts
export const myFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { db } = await import('#/db')           // dynamic import — server only
  const { auth } = await import('#/lib/auth')   // same
  const { getRequestHeaders } = await import('@tanstack/react-start/server')
  // ... use db here
})
```

Dynamic imports ensure Vite treats these modules as server-only and never includes them in the client bundle.

---

## Auth

### `getRequestSession` is a `createServerFn`
**Decision:** The `getRequestSession` helper that calls `auth.api.getSession()` is wrapped in `createServerFn({ method: 'GET' })`, not a plain async function.

**Reason:** `auth.api.getSession` reads request headers via `getRequestHeaders()` from `@tanstack/react-start/server` — a server-only API. Wrapping it as a server function guarantees it never leaks into the client bundle and cannot be called outside the server context.

---

## Dashboard

### Dashboard data fetched in `beforeLoad`, not inside component
**Decision:** `getDashboardData()` and `getOwnerStats()` are called in the route's `beforeLoad` and passed as context to the component.

**Reason:** TanStack Start's `beforeLoad` runs on the server before the component hydrates. This means the dashboard data is available immediately on first render (SSR), and refreshes automatically on every navigation to the route. No `useEffect` / client-side loading state required.

### Revenue aggregation uses PostgreSQL `::int` cast
**Decision:** `sql<number>\`coalesce(sum(paid_amount_sen), 0)::int\`` is used instead of JavaScript aggregation.

**Reason:** `pg` returns numeric columns as strings by default. Casting to `::int` in the query ensures Drizzle returns a JavaScript number directly, with `Number()` as a safety fallback in application code.

### "Due today" uses UTC day boundaries
**Decision:** "Due today" is defined as `endDate >= UTC midnight today AND endDate < UTC midnight tomorrow`.

**Reason:** All timestamps in the schema use `mode: 'date'` (UTC). Using UTC boundaries is consistent with how dates are stored and avoids timezone-dependent surprises.

### "Overdue" sorted ascending (most overdue first)
**Decision:** Overdue rentals are ordered by `endDate ASC`.

**Reason:** The earliest `endDate` is the most overdue rental — the one requiring the most urgent attention. Showing the most critical items at the top of the list is the safest default for operational dashboards.

---

## Stage 5: Internal Dashboard

### Owner dashboard is `/admin/` — no separate route
**Decision:** The owner dashboard lives at `/admin/index.tsx` and includes both the owner stats / fleet overview and the staff management panel (previously inline in that route).

**Reason:** Owner sessions always start at `/admin/`. A separate `/admin/dashboard` route would duplicate the nav structure and split two naturally co-located concerns. All content is in `AdminDashboard.tsx` which uses `AdminSidebarShell`.

### Staff role redirects away from `/admin/`
**Decision:** If a non-owner accesses `/admin/`, `beforeLoad` throws `redirect({ to: '/admin/cars' })`.

**Reason:** Staff do not see revenue stats or staff management — they should not land on `/admin/`. Their equivalent dashboard is `/app/` (`StaffDashboard`).

### Dashboard data is view-only
**Decision:** The dashboard shows status summaries and alert rows as links to full rental detail pages — no inline actions (e.g. no "Mark returned" button on the dashboard itself).

**Reason:** Actions on rentals involve multiple fields and state checks. Forcing navigation to the detail page ensures the full context is visible before any mutation, reducing the risk of operator error.

### No auto-refresh / polling
**Decision:** Dashboard data is not polled. It refreshes on navigation (TanStack `beforeLoad`).

**Reason:** The fleet is small; real-time push or polling adds complexity (WebSockets / intervals) with little benefit for the target use case. Navigation-based refresh is sufficient and simpler.
