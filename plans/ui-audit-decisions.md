# UI/UX Audit — Cars Inventory Table & Form

> Session date: 2026-03-24
> Scope: `/admin/cars/` list page (table, header, form overlay)
> Questioning mode: Normal
> Status: ✅ Done

---

## Issues Identified

| # | Area | Issue |
|---|---|---|
| I1 | Table cell padding | Asymmetric: first/last cells used `pl-5`/`pr-5` (1.25rem) while inner cells used CSS `0.75rem`. Inconsistent visual rhythm. |
| I2 | Table row height | `0.65rem` vertical padding was too tall for a data-dense admin table |
| I3 | Color column | Plain text label with no visual indicator — wasted opportunity for scanability |
| I4 | Action buttons | Full-size `.button-secondary` (`0.82rem 1.2rem` padding) in table rows felt bulky and disrupted row density |
| I5 | Form panel | `1.75rem` padding + `mb-5` header + `space-y-4` fields — slightly over-spaced for a slide-in overlay |

---

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Compact table density** | Reduce vertical padding from `0.65rem` → `0.42rem`. Owner views many rows daily — tighter rows = more data visible without scrolling. |
| D2 | **Standardize cell horizontal padding** | All cells use Tailwind `px-3` (uniform). Remove asymmetric `pl-5`/`pr-5`. Cleaner visual rhythm. |
| D3 | **Tailwind-first padding** | Removed `padding` from `.cars-table thead th` and `.cars-table tbody td` CSS rules. Applied via Tailwind on each `<th>`/`<td>` in JSX instead. More explicit, easier to override per-cell. |
| D4 | **Color swatch dot** | Added `COLOR_SWATCH` map (CarColor → hex) and rendered a `size-2.5 rounded-full` dot before the label. Fast visual scan without adding a column. |
| D5 | **Keep Year as own column** | Retains sortability and clarity. Not merged into Vehicle. |
| D6 | **Compact row action buttons** | New `ROW_BTN` constant with `px-2.5 py-1 text-xs` + same chip styling as existing secondary buttons. Defined outside component to avoid string recreation. `<Pencil>` icon reduced 12→11. |
| D7 | **Form overlay tightening** | Panel padding: `1.75rem` → `1.5rem`. Header margin: `mb-5` → `mb-4`, kicker: `mb-1` → `mb-0.5`, title: `text-xl` → `text-lg`. Form fields: `space-y-4` → `space-y-3`. |

---

## Files Changed

- `src/styles.css` — removed padding from `.cars-table thead th` and `.cars-table tbody td`; `.form-panel` padding reduced
- `src/routes/admin/cars/index.tsx` — `COLOR_SWATCH` constant, `ROW_BTN` constant, all `<th>`/`<td>` padding via Tailwind, color swatch rendering, compact action buttons, form panel spacing
