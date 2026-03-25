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

---

## Stage 7 — Document Generation

### PDF library: `@react-pdf/renderer`
**Decision:** Use `@react-pdf/renderer` for server-side PDF generation.

**Reason:** Runs in Node.js server context (no headless browser needed), outputs proper vector PDFs, and uses a React-like component model that matches the project's stack. Alternatives (Puppeteer, jsPDF) require either a browser runtime or low-level canvas APIs.

### PDF delivery: inline preview + download via query param
**Decision:** Both routes (`/api/documents/agreement/$rentalId`, `/api/documents/invoice/$rentalId`) serve the same endpoint. `?download=1` switches `Content-Disposition` from `inline` to `attachment`.

**Reason:** Staff often want to preview the document first. A single endpoint avoids duplication. Browser handles rendering (PDF.js in Chromium/Firefox) when inline.

### API routes are top-level `/api/documents/...`, not under `/admin/`
**Decision:** Document routes are at `/api/documents/agreement/$rentalId` and `/api/documents/invoice/$rentalId`, outside the admin route group.

**Reason:** These are raw API endpoints returning binary data — they don't render any React UI, so nesting under the `/admin` layout route would cause a layout mismatch. Access is controlled by a session check inside the handler (both owner and staff roles allowed).

### Auth in API route handlers: direct `auth.api.getSession`
**Decision:** In API route `server.handlers`, authenticate using `auth.api.getSession({ headers: request.headers })` directly rather than `requireRole` (which uses `createServerFn` + `getRequestHeaders`).

**Reason:** `requireRole` relies on `createServerFn`'s server context; `request` is the raw `Request` object available in the handler. Using `request.headers` directly is simpler and avoids mixing server-function context with handler context.

### Data fetched inline in API routes (not via `getRentalById`)
**Decision:** Each document API route issues its own Drizzle query joining `rentals + cars + customers`, including `customers.address`.

**Reason:** `getRentalById` (in `rental-functions.ts`) omits `customers.address` as it isn't needed for the app UI. Rather than modifying the shared function, the document routes fetch only what they need with a targeted query.

### Agreement available for `active` + `closed`; invoice only for `closed`
**Decision:** Rental agreements can be generated as soon as the rental is active (vehicle handed over). Invoices are only available once the rental is closed (vehicle returned).

**Reason:** The agreement is a contract that exists from handover. The invoice finalises billing details (actual return date, final amounts) which are only confirmed on close.

---

## Stage 8 — Customer Portal: Browse & Car Photos

### R2 upload flow: presigned PUT URL via server function
**Decision:** Upload flow uses `generatePresignedUrl` (server function) → browser PUTs file directly to R2 → `saveCarPhoto` (server function) writes the DB row.

**Reason:** Avoids routing large binary payloads through the TanStack Start server. R2 presigned PUT URLs are single-use and expire after 15 minutes, keeping uploads secure without streaming through our server.

### First uploaded photo auto-set as cover
**Decision:** In `saveCarPhoto`, if no other photos exist for the car, `isCover` is set to `true` automatically.

**Reason:** Ensures every car with at least one photo always has a designated cover photo for the landing page grid, without requiring a separate user action.

### `notInArray` guard for date availability filter
**Decision:** In `filterPublicCars`, the `notInArray(cars.id, conflictingIds)` condition is only appended when `conflictingIds.length > 0`.

**Reason:** An empty `NOT IN ()` is invalid SQL in PostgreSQL and would throw a runtime error. The guard skips the condition entirely when there are no conflicts, returning all available cars.

### `deleteCarPhoto` best-effort R2 deletion
**Decision:** R2 object deletion errors are caught and logged but do not bubble up; the DB row is deleted regardless.

**Reason:** The DB row is the source of truth for what the app displays. A stale R2 object that is unreachable from the app is acceptable. Failing the entire operation because R2 is temporarily unreachable would degrade the admin UX unnecessarily.

### routeTree.gen.ts: `/cars/$carId` registered as root-level child
**Decision:** `CarsCarIdRoute` uses `getParentRoute: () => rootRouteImport` (not `AdminRoute` or `AppRoute`).

**Reason:** The public car detail page is a top-level public route, not nested under the admin or customer app. It must be accessible without any auth guard.

### Landing page hero uses `PublicPageShell` with `className=""`
**Decision:** The `className` prop on `PublicPageShell` is set to `""` on the index route so the `<main>` renders with no padding or max-width. Individual sections (hero, browse) manage their own layout.

**Reason:** The hero section needs to be full-bleed (edge-to-edge). Overriding the default `page-wrap px-4 pb-12 pt-10` class via the `className` prop avoids adding wrapper divs or negative margins.

### Amber (#b07a1a / #e8b84a dark) for price display
**Decision:** Daily rate figures use a warm amber colour distinct from the teal brand palette.

**Reason:** Price is a key decision-making signal. A contrasting warm accent draws the eye to the rate without competing with the teal/green brand colours used for interactive elements.
