# Confirmed brief: XQ Car Fleet Admin redesign

## Job and audience
Owners/super_admins and staff running fleet ops day-to-day (bookings, payments, cars,
customers, promos, affiliates, settings, maintenance, reports). Today's admin UI is
functionally sound and already tokenized to DESIGN.md (Carbon & Ember), but feels flat/
generic, has some workflow friction, and is inconsistent route-to-route — a different
"weight class" from the landing page even though the color/type system is shared.

## Outcome and proof
- Success: admin reads as the same premium product as the landing page — confident,
  considered, consistent — without sacrificing the speed data-heavy screens need.
- Proof: every admin route ship-ready (shadcn componentry, empty/loading/error states,
  responsive, a11y-checked); before/after screenshots per route; no regression in table/
  list scan speed.

## Selected direction
- **Componentry**: replace hand-rolled CSS (`.status-tab`, `.island-shell`,
  `.admin-sidebar`, etc.) with shadcn primitives *where it adds real behavior* —
  Tabs, Card, Table, DropdownMenu, Dialog, Sidebar, Badge, Avatar. Where existing custom
  CSS already matches DESIGN.md and works well with no behavioral gap, leave it — this is
  a targeted upgrade, not a rewrite-for-its-own-sake.
- **Richness**: "mostly dense, selectively rich." Tables/lists stay dense and fast
  (current row heights, tabular-nums, compact padding). Non-data surfaces — dashboard KPI
  cards, empty states, page headers, top-of-page moments — borrow landing's shadow-md/xl,
  radius-xl, and hover-lift language so those moments feel premium. No marketing motion,
  imagery, or copy bleeding into admin.
- **Dark mode**: deferred. Tokens are already defined in DESIGN.md; verification is a
  fast-follow once light mode ships.

## Scope and boundaries
- **Full admin, one pass, ship-ready everywhere**: all ~10 routes —
  dashboard, cars (list + detail), customers (list + detail), rentals (list + detail),
  promos (list + detail), affiliates (list + detail + payouts), settings, maintenance,
  reports.
- **Build order** (sequenced for dependency reuse, not usage frequency):
  1. `AdminSidebarShell` + `admin/index.tsx` (dashboard, KPI grid, Bookings/Payments/Cars
     tabs) — establishes the reusable shadcn pattern (Sidebar, Tabs, Card, Table).
  2. Fleet: `cars`, `rentals`, `customers` (list + detail routes).
  3. Growth: `promos`, `affiliates` (+ payouts).
  4. `settings`, `reports`, `maintenance`.
- **Untouched**: DESIGN.md tokens (already correct), auth/session logic, data-fetching
  layer (`getAdminDashboardKpis` and equivalents), routing structure, dark mode.
- **Anti-goal**: admin must not become "landing-page expressive" — no hero imagery, no
  scroll-triggered motion, no marketing copy tone. Borrow visual language, not content
  density or public-page pacing.

## States and ranges
- Every table/list needs empty, loading (skeleton, not blank), and error states —
  existing `KpiSkeleton`, `TableSkeleton`, `ErrorPanel` patterns to be reused/extended
  under the new componentry, not discarded.
- Row-action menus (edit/delete/etc.) move to shadcn `DropdownMenu`; destructive actions
  keep DESIGN.md's confirmation-dialog rule via shadcn `Dialog`/`AlertDialog`.
- Responsive: sidebar collapse/mobile-drawer behavior in `AdminSidebarShell` must be
  preserved or upgraded via shadcn `Sidebar`, not regressed.

## Interaction and layout
- Sidebar: consider shadcn `Sidebar` primitive to replace the custom nav markup, keeping
  current section grouping (Overview/Fleet/Growth/Team/System), active-state ember
  indicator, and collapse behavior from DESIGN.md's Navigation spec.
- Tabs (Bookings/Payments/Cars and similar route-level tab switchers): shadcn `Tabs`
  replacing `.status-tab` — fixes keyboard nav/focus management gaps in the current
  custom implementation.
- Tables: shadcn `Table` wrapping existing `DataTable.tsx` conventions (row height,
  header style, sort indicator, hover row) from DESIGN.md's Data Table spec.
- KPI cards / dashboard: shadcn `Card` with landing-level shadow/radius on this
  surface specifically (the "selectively rich" moment).

## Constraints and open decisions left to the builder
- Which shadcn components need `shadcn add` first (Card, Tabs, Table, DropdownMenu,
  Dialog/AlertDialog, Sidebar, Badge, Avatar are not yet installed per `components.json`
  — only button/input/sheet/textarea/combobox/input-group exist today).
  - **Note**: this project uses the `shadcn` skill for adding/configuring shadcn
    components (style `base-nova`, baseColor `neutral`) — invoke it rather than running
    the CLI ad hoc, so presets/conventions stay consistent.
- Exact per-route mapping of "replace vs. keep" custom CSS — builder judgment call per
  DESIGN.md compliance, guided by the principle above (behavioral gap = replace,
  cosmetic-only = leave alone).
- Migration approach (route-by-route PRs vs. one large PR) — not specified; default to
  route-by-route PRs following the build order above for reviewability.

---
*This brief is confirmed. Implementation (shadcn installs, component swaps, per-route
work) is a separate step — this document defines what to build and why, not the code.*
