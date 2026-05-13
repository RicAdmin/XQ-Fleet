# XQ Car Fleet — Design System

**Codename: Carbon & Ember**
Version 1.0 · March 2026

---

## Overview

XQ Car Fleet serves a mixed fleet — economy and premium vehicles under a single brand. The design system must feel trustworthy enough for everyday customers and refined enough for premium ones, without alienating either segment.

The system is **unified**: customer portal, staff hub, and admin tools share the same palette, typography, and component language. Density and expressiveness adapt by context — public pages breathe; internal tools compact — but the brand voice remains consistent.

---

## Design Principles

1. **Clarity first.** Every surface communicates status at a glance. Hierarchy is never ambiguous.
2. **Warmth with precision.** Amber signals approachability. Tight spacing and weight-based hierarchy signal professionalism.
3. **Unified surface.** Customer and internal tools share one palette. Density is the only dimension that differs.
4. **Accessible by default.** WCAG AA minimum for all text (4.5:1 normal, 3:1 large). Focus states always visible.
5. **Progressive richness.** Public pages may be expressive — imagery, animation, breathing room. Internal tools optimize for data density and speed.

---

## Color System

All values are defined as CSS custom properties in `:root`. Components must reference tokens, never raw hex.

### Brand Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--ink` | `#111110` | `#F5F4F2` | Primary text, brand base |
| `--ink-soft` | `#78716C` | `#A8A29E` | Secondary text, captions |
| `--ink-muted` | `#A8A29E` | `#6B6560` | Placeholder, disabled text |
| `--ember` | `#D97706` | `#F59E0B` | Primary accent, CTA, links |
| `--ember-deep` | `#B45309` | `#D97706` | Hover/pressed accent |
| `--ember-wash` | `rgba(217,119,6,0.08)` | `rgba(245,158,11,0.12)` | Accent tint backgrounds |
| `--ember-border` | `rgba(217,119,6,0.22)` | `rgba(245,158,11,0.24)` | Accent-tinted borders |

### Surface Tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#FAFAF9` | `#0C0C0B` | Page background |
| `--surface` | `#FFFFFF` | `#1A1917` | Cards, panels, modals |
| `--surface-raised` | `#FFFFFF` | `#221F1C` | Elevated surfaces (dropdowns, toasts) |
| `--muted` | `#F5F4F2` | `#292927` | Muted/subdued surfaces |
| `--border` | `rgba(17,17,16,0.10)` | `rgba(245,244,242,0.10)` | Default borders, dividers |
| `--border-strong` | `rgba(17,17,16,0.18)` | `rgba(245,244,242,0.18)` | Emphasized borders |

### Semantic Tokens

| Token | Hex | Usage |
|---|---|---|
| `--success` | `#16A34A` | Success states |
| `--success-wash` | `rgba(22,163,74,0.08)` | Success backgrounds |
| `--success-border` | `rgba(22,163,74,0.22)` | Success borders |
| `--error` | `#DC2626` | Error/destructive |
| `--error-wash` | `rgba(220,38,38,0.08)` | Error backgrounds |
| `--error-border` | `rgba(220,38,38,0.22)` | Error borders |
| `--warning` | `#D97706` | Warning (same as `--ember`) |
| `--warning-wash` | `rgba(217,119,6,0.08)` | Warning backgrounds |
| `--info` | `#0284C7` | Informational |
| `--info-wash` | `rgba(2,132,199,0.08)` | Info backgrounds |

> **Note:** `--ember` and `--warning` intentionally share the same hue. This is acceptable because warning context is always reinforced by an icon or label — color is never the sole signal.

### Status Colors (Fleet & Rental)

These are applied via the `StatusBadge` component. Never hardcode hex in component markup.

| Status | Token | Background | Text |
|---|---|---|---|
| `available` | `--status-available` | `var(--success-wash)` | `#15803D` |
| `reserved` | `--status-reserved` | `rgba(29,78,216,0.08)` | `#1D4ED8` |
| `payment-pending` | `--status-payment-pending` | `rgba(91,62,168,0.08)` | `#5B3EA8` |
| `rented` | `--status-rented` | `var(--muted)` | `var(--ink)` |
| `maintenance` | `--status-maintenance` | `var(--warning-wash)` | `#92400E` |
| `damaged` | `--status-damaged` | `var(--error-wash)` | `#B91C1C` |
| `retired` | `--status-retired` | `var(--muted)` | `var(--ink-muted)` |
| `active` | `--status-active` | `var(--success-wash)` | `#15803D` |
| `closed` | `--status-closed` | `var(--muted)` | `var(--ink-muted)` |
| `cancelled` | `--status-cancelled` | `var(--error-wash)` | `#B91C1C` |
| `paid` | `--status-paid` | `var(--success-wash)` | `#15803D` |
| `partial` | `--status-partial` | `var(--warning-wash)` | `#92400E` |
| `unpaid` | `--status-unpaid` | `var(--error-wash)` | `#B91C1C` |

### Palette Reference (Raw Values)

These are source values only. Use tokens in code.

```
Ink scale (warm gray-brown)
  ink-900  #111110    ink-700  #292927    ink-500  #78716C
  ink-300  #A8A29E    ink-100  #F5F4F2

Ember scale (amber)
  ember-700  #B45309    ember-600  #D97706    ember-500  #F59E0B
  ember-100  #FEF3C7    ember-50   #FFFBEB

Green scale (success/palm)
  green-700  #15803D    green-600  #16A34A    green-500  #22C55E

Red scale (error/danger)
  red-700    #B91C1C    red-600    #DC2626

Blue scale (reserved/info)
  blue-700   #1D4ED8    blue-600   #2563EB

Sky scale (info)
  sky-600    #0284C7
```

---

## Typography

### Fonts

| Role | Family | Source | Weights |
|---|---|---|---|
| Display | Bricolage Grotesque | Google Fonts | 400 500 600 700 800 |
| Body / UI | DM Sans | Google Fonts | 300 400 500 600 700 |
| Monospace | Geist Mono | `@fontsource-variable/geist` | 400 500 |

**Font variables:**
```css
--font-display: 'Bricolage Grotesque Variable', ui-sans-serif, system-ui;
--font-sans:    'DM Sans Variable', ui-sans-serif, system-ui;
--font-mono:    'Geist Mono', ui-monospace, 'Cascadia Code', monospace;
```

### Type Scale

All sizes in `rem` (base 16px). Use named scale tokens where possible.

| Token | rem | px | Usage |
|---|---|---|---|
| `--text-2xs` | 0.6875rem | 11px | Legal, fine print |
| `--text-xs` | 0.75rem | 12px | Badges, chips, field labels |
| `--text-sm` | 0.875rem | 14px | Secondary body, table cells |
| `--text-base` | 1rem | 16px | Primary body text |
| `--text-lg` | 1.125rem | 18px | Lead text, emphasized body |
| `--text-xl` | 1.25rem | 20px | Small headings |
| `--text-2xl` | 1.5rem | 24px | Section headings |
| `--text-3xl` | 1.875rem | 30px | Page headings |
| `--text-4xl` | 2.25rem | 36px | Large headings |
| `--text-5xl` | 3rem | 48px | Hero subheadings |
| `--text-display` | clamp(3rem, 8vw, 5.5rem) | — | Landing hero titles |

### Typography Rules

- **Body text:** `--text-base`, DM Sans 400, `line-height: 1.6`
- **Secondary / captions:** `--text-sm`, DM Sans 400, `color: var(--ink-soft)`
- **Labels / field labels:** `--text-xs`, DM Sans 700, uppercase, `letter-spacing: 0.08em`
- **Section headings:** `--text-2xl`, Bricolage Grotesque 600
- **Page titles:** `--text-3xl`, Bricolage Grotesque 700
- **Numbers in tables/data:** Use `font-variant-numeric: tabular-nums` to prevent layout shift
- **Minimum body size:** 14px — never below this for interactive or readable content
- **Line length:** 60–75 characters max for body paragraphs; use `max-w-prose`

### Font Loading

```html
<!-- In <head> — preconnect first -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap"
  rel="stylesheet"
/>
```

---

## Spacing

Base unit: **4px**. All spacing values are multiples of 4.

| Token | Value | Tailwind |
|---|---|---|
| `--space-1` | 4px | `p-1` |
| `--space-2` | 8px | `p-2` |
| `--space-3` | 12px | `p-3` |
| `--space-4` | 16px | `p-4` |
| `--space-5` | 20px | `p-5` |
| `--space-6` | 24px | `p-6` |
| `--space-8` | 32px | `p-8` |
| `--space-10` | 40px | `p-10` |
| `--space-12` | 48px | `p-12` |
| `--space-16` | 64px | `p-16` |
| `--space-20` | 80px | `p-20` |
| `--space-24` | 96px | `p-24` |

### Spacing Guidelines

- **Component internal padding:** `--space-2` (8px) to `--space-4` (16px)
- **Section gaps:** `--space-8` (32px) to `--space-12` (48px) on desktop; `--space-6` (24px) on mobile
- **Between cards in a grid:** `--space-4` (16px) default, `--space-6` (24px) for feature grids
- **Page horizontal gutter:** `--space-4` mobile → `--space-8` tablet → auto for desktop
- **Page max-width:** `1080px` (internal tools) / `1200px` (landing/public)

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 4px | Badges, chips, code |
| `--radius-sm` | 6px | Buttons (sm/xs), inputs |
| `--radius-md` | 8px | Buttons (default), inputs, select |
| `--radius-lg` | 12px | Cards, panels, dropdowns |
| `--radius-xl` | 16px | Modals, drawers, feature cards |
| `--radius-2xl` | 24px | Auth cards, large modals |
| `--radius-full` | 9999px | Pills, avatars |

---

## Elevation & Shadow

Shadows use the warm ink base (`17, 17, 16`) in light mode. Dark mode inverts to pure black.

| Token | Value | Usage |
|---|---|---|
| `--shadow-xs` | `0 1px 2px rgba(17,17,16,.05)` | Subtle lift (badges) |
| `--shadow-sm` | `0 1px 4px rgba(17,17,16,.06), 0 1px 2px rgba(17,17,16,.04)` | Cards, inputs |
| `--shadow-md` | `0 4px 14px rgba(17,17,16,.08), 0 1px 3px rgba(17,17,16,.04)` | Raised cards, popovers |
| `--shadow-lg` | `0 8px 28px rgba(17,17,16,.10), 0 2px 6px rgba(17,17,16,.06)` | Modals, drawers |
| `--shadow-xl` | `0 20px 60px rgba(17,17,16,.14), 0 4px 12px rgba(17,17,16,.08)` | Landing search card, hero elements |

**Elevation hierarchy:**
- Level 0 (flat): `--bg` — page background
- Level 1 (card): `--surface` + `--shadow-sm` + `--border`
- Level 2 (popover/dropdown): `--surface-raised` + `--shadow-md`
- Level 3 (modal): `--surface-raised` + `--shadow-lg` + scrim overlay
- Level 4 (hero element): `--surface` + `--shadow-xl`

---

## Motion & Animation

### Timing

| Name | Duration | Easing | Usage |
|---|---|---|---|
| Instant | 0ms | — | State visibility toggles (no visual |
| Micro | 120ms | `ease-out` | Button press, badge appear |
| Fast | 180ms | `ease-out` | Color transitions, hover states |
| Standard | 250ms | `cubic-bezier(0.16,1,0.3,1)` | Panel open/close, accordion |
| Expressive | 400ms | `cubic-bezier(0.16,1,0.3,1)` | Modal enter, page transition |

### Rules

- Use `transform` and `opacity` only — never animate `width`, `height`, `top`, `left`
- Exit animations should be **~60% of enter duration** (feel faster, more responsive)
- Always include `@media (prefers-reduced-motion: reduce)` — disable or greatly reduce all animations
- Loading states (>300ms wait): show skeleton shimmer, not a blank space
- Hover color transitions: `180ms ease` for `color`, `background-color`, `border-color`

### Standard transition shorthand

```css
transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease, opacity 180ms ease;
```

---

## Layout

### Breakpoints

| Name | Min-width | Target |
|---|---|---|
| `xs` | 375px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktop / landscape tablet |
| `xl` | 1280px | Standard desktop |
| `2xl` | 1440px | Wide desktop |

### Page Wrappers

```css
/* Standard internal page wrapper */
.page-wrap {
  width: min(1080px, calc(100% - 2rem));
  margin-inline: auto;
}

/* Landing / public max-width */
.landing-wrap {
  width: min(1200px, calc(100% - 2rem));
  margin-inline: auto;
}
```

### Z-Index Scale

| Token | Value | Usage |
|---|---|---|
| `--z-base` | 0 | Default stacking |
| `--z-raised` | 10 | Cards with hover lift |
| `--z-sticky` | 20 | Sticky table headers |
| `--z-nav` | 40 | Navigation bars, sidebars |
| `--z-dropdown` | 100 | Dropdowns, popovers |
| `--z-modal` | 200 | Modals, sheets |
| `--z-toast` | 300 | Toast notifications |
| `--z-tooltip` | 400 | Tooltips |

---

## Components

### Button

**Variants:** `default` · `outline` · `secondary` · `ghost` · `destructive` · `link`
**Sizes:** `xs` · `sm` · `default` · `lg` · `icon-xs` · `icon-sm` · `icon` · `icon-lg`

| Size | Height | Font size | Padding | Radius |
|---|---|---|---|---|
| `xs` | 24px | 12px | 8px / 4px | `--radius-sm` |
| `sm` | 28px | 13px | 10px / 5px | `--radius-md` |
| `default` | 32px | 14px | 12px / 6px | `--radius-md` |
| `lg` | 36px | 14px | 14px / 8px | `--radius-md` |

**Default variant:**
- Background: `var(--ink)` → hover: `var(--ink-700)` (slightly lighter)
- Text: white
- Focus: `ring-2 ring-offset-2 ring-ember-500`
- Disabled: `opacity-50 cursor-not-allowed`
- Loading: spinner replaces label, button width locked

**Destructive variant:**
- Background: `var(--error-wash)`, Text: `var(--error)`, Border: `var(--error-border)`
- Hover: `var(--error)` background, white text

**Rules:**
- Every async action must show loading state (disable + spinner)
- Destructive actions require confirmation dialog before execution
- Icon buttons must have `aria-label`
- One primary CTA per screen — secondary actions use `outline` or `ghost`

---

### Input

| Property | Value |
|---|---|
| Height | 32px (`h-8`) |
| Font | `--text-sm`, DM Sans 400 |
| Padding | `px-3 py-1.5` |
| Radius | `--radius-md` |
| Border | `1px solid var(--border-strong)` |
| Background | `var(--surface)` |
| Focus | `border-ember outline-none ring-2 ring-ember/20` |
| Disabled | `bg-muted opacity-60 cursor-not-allowed` |
| Error | `border-error ring-2 ring-error/20` |

**Rules:**
- Every input must have a visible `<label>` — never placeholder-only
- Error message appears **below** the field, in `--text-xs`, `color: var(--error)`
- Validate on **blur**, not on keystroke
- Use semantic `type` attributes (`email`, `tel`, `number`, `date`)
- Required fields marked with `*` in the label

---

### Badge / Status Badge

```
Height:     20px–22px
Font:       --text-xs, weight 600, uppercase, letter-spacing 0.06em
Padding:    2px 8px
Radius:     --radius-xs (4px)
```

Status badges use semantic token pairs from the Status Colors table above. Never use raw hex.

For non-status badges (e.g., category labels on cars):
- Background: `var(--muted)`, Text: `var(--ink-soft)`, Border: `var(--border)`

---

### Card / Panel

**Standard card (`.island-shell`):**
```
Background:    var(--surface)
Border:        1px solid var(--border)
Border-radius: var(--radius-lg)
Box-shadow:    var(--shadow-sm)
Padding:       var(--space-4) / var(--space-6) on wider screens
```

**Feature card (public pages):**
```
Border-radius: var(--radius-xl)
Box-shadow:    var(--shadow-md)
Hover:         translateY(-2px), shadow-lg — 200ms ease-out
```

**Data surface (tables, lists):**
- No shadow. Border only. Radius `--radius-md`.
- Header row: `background: var(--muted)`, font `--text-xs` uppercase

---

### Data Table

- Row height: `40px` minimum (touch-safe)
- Header: `--text-xs`, DM Sans 700, uppercase, `letter-spacing: 0.08em`, `var(--ink-muted)` color
- Body cells: `--text-sm`, DM Sans 400
- Numeric cells: `font-variant-numeric: tabular-nums`, right-aligned
- Hover row: `background: var(--muted)`
- Sort indicator: amber chevron, `aria-sort` set on `<th>`
- Empty state: centered message + action CTA, min-height 240px

---

### Navigation

**Sidebar (admin/staff):**
- Width: 220px expanded / 56px collapsed
- Background: `var(--surface)` with `var(--border)` right edge
- Nav items: 36px height, 12px horizontal padding, `--radius-md`
- Active: `background: var(--ember-wash)`, `color: var(--ember-deep)`, left 3px amber bar
- Hover: `background: var(--muted)`
- Icons: 16px, Lucide, consistent stroke width 1.5px

**Top bar:**
- Height: 52px
- Background: `var(--surface)` / `backdrop-blur-lg` on scroll
- Bottom border: `var(--border)`

**Public header:**
- Sticky, backdrop-blur
- Nav links: `--text-sm`, DM Sans 500, underline gradient on hover (ember gradient)

---

### Toast / Notification

- Position: bottom-right, 16px from edge
- Width: 320px max
- Radius: `--radius-lg`
- Shadow: `--shadow-lg`
- Auto-dismiss: 4 seconds (info/success) / persistent (error)
- `aria-live="polite"` — never steal focus
- Must include dismiss `×` button

---

## Iconography

- **Library:** Lucide React (v0.545+)
- **Stroke width:** 1.5px throughout — never mix with 2px or filled icons
- **Default size:** 16px inline text / 20px standalone / 24px feature icons
- **Color:** inherit from text color (`currentColor`) unless semantic (status dot, etc.)
- **Touch targets:** If icon is clickable and < 24px, add `p-2` padding or use `hitSlop`
- **No emoji as icons.** No exceptions.

---

## Accessibility

### Contrast Minimums (WCAG AA)

| Context | Minimum ratio |
|---|---|
| Body text (< 18px) | 4.5:1 |
| Large text (≥ 18px or bold ≥ 14px) | 3:1 |
| UI components (borders, icons) | 3:1 |
| Placeholder text | 4.5:1 |
| Disabled elements | Exempt |

### Focus

- All interactive elements: `ring-2 ring-offset-2` with ember or ink ring color
- Never `outline: none` without a replacement focus style
- Tab order must match visual reading order

### Screen Reader

- All icon-only buttons: `aria-label` required
- Status badges: `role="status"` or readable text alternative
- Form errors: `aria-describedby` linking to error message
- Dynamic content updates: `aria-live="polite"` (info/success) / `aria-live="assertive"` (errors)
- Images: meaningful `alt` text; decorative images `alt=""`

### Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Dark Mode

Toggle via `data-theme="dark"` on `<html>`. Also respects `prefers-color-scheme: dark` by default.

**Rules:**
- Surfaces shift from warm-white to warm-dark (`#0C0C0B` / `#1A1917`) — not inverted
- Text shifts from `#111110` to `#F5F4F2`
- Ember accent becomes brighter (`#F59E0B` vs `#D97706`) to maintain contrast on dark surfaces
- All semantic states (error, success, warning) must be independently verified in dark mode
- Scrim overlays: `rgba(0,0,0,0.5)` minimum for modals
- Dark mode is tested as a first-class surface, not an afterthought

---

## Known Issues (From Audit)

Issues resolved in the March 2026 token migration are marked ✅. Remaining items should be addressed as components are touched.

| # | Issue | Location | Severity | Status |
|---|---|---|---|---|
| 1 | `--amber` and `--lagoon` used interchangeably for the same value | `styles.css` | Medium | ✅ Fixed — legacy names kept as aliases; `--ember` / `--ember-deep` added as canonical tokens |
| 2 | Status badge colors hardcoded in raw hex | `styles.css` | High | ✅ Fixed — all 14 badge variants now use `--status-*-bg` / `--status-*-text` tokens |
| 3 | Landing page styles (`.landing-*`) disconnected from design token system | `styles.css` | Medium | Open |
| 4 | Fleet status dot colors use raw hex | `StaffDashboard.tsx` | Medium | ✅ Fixed — `STATUS_META` uses `--dot-*` CSS variable references |
| 5 | `--amber` doubles as brand accent AND warning semantic | `styles.css` | High | ✅ Fixed — `--ember` = brand accent, `--warning` = semantic warning (same hue, separate tokens) |
| 6 | Button heights irregular (`h-6/h-7/h-8/h-9`) | `button.tsx` | Low | Accepted — follows shadcn base-ui conventions; see DESIGN.md size table |
| 7 | No z-index scale defined | `styles.css` | Medium | ✅ Fixed — `--z-base` through `--z-tooltip` added to `:root` |
| 8 | Dark mode status badge contrast not verified | `styles.css` | High | ✅ Fixed — dark mode token overrides added with lightened text colors for ≥4.5:1 contrast |
| 9 | `::selection` color not in token system | `styles.css` | Low | ✅ Fixed — `::selection` now uses `var(--ember-wash)` |
| 10 | Raw `px` border-radius in `button.tsx` size variants | `button.tsx` | Low | Accepted — uses `min(var(--radius-md), Npx)` clamping which is intentional |

---

## CSS Token Reference

Paste this block into `:root` in `styles.css` to replace the current token definitions:

```css
:root {
  /* Brand */
  --ink:            #111110;
  --ink-soft:       #78716C;
  --ink-muted:      #A8A29E;
  --ember:          #D97706;
  --ember-deep:     #B45309;
  --ember-wash:     rgba(217, 119, 6, 0.08);
  --ember-border:   rgba(217, 119, 6, 0.22);

  /* Surfaces */
  --bg:             #FAFAF9;
  --surface:        #FFFFFF;
  --surface-raised: #FFFFFF;
  --muted:          #F5F4F2;
  --border:         rgba(17, 17, 16, 0.10);
  --border-strong:  rgba(17, 17, 16, 0.18);

  /* Semantic */
  --success:        #16A34A;
  --success-wash:   rgba(22, 163, 74, 0.08);
  --success-border: rgba(22, 163, 74, 0.22);
  --error:          #DC2626;
  --error-wash:     rgba(220, 38, 38, 0.08);
  --error-border:   rgba(220, 38, 38, 0.22);
  --warning:        #D97706;
  --warning-wash:   rgba(217, 119, 6, 0.08);
  --info:           #0284C7;
  --info-wash:      rgba(2, 132, 199, 0.08);

  /* Typography */
  --font-display: 'Bricolage Grotesque Variable', ui-sans-serif, system-ui;
  --font-sans:    'DM Sans Variable', ui-sans-serif, system-ui;
  --font-mono:    'Geist Mono', ui-monospace, monospace;

  /* Radius */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-xs: 0 1px 2px rgba(17, 17, 16, 0.05);
  --shadow-sm: 0 1px 4px rgba(17, 17, 16, 0.06), 0 1px 2px rgba(17, 17, 16, 0.04);
  --shadow-md: 0 4px 14px rgba(17, 17, 16, 0.08), 0 1px 3px rgba(17, 17, 16, 0.04);
  --shadow-lg: 0 8px 28px rgba(17, 17, 16, 0.10), 0 2px 6px rgba(17, 17, 16, 0.06);
  --shadow-xl: 0 20px 60px rgba(17, 17, 16, 0.14), 0 4px 12px rgba(17, 17, 16, 0.08);

  /* Z-index */
  --z-base:     0;
  --z-raised:   10;
  --z-sticky:   20;
  --z-nav:      40;
  --z-dropdown: 100;
  --z-modal:    200;
  --z-toast:    300;
  --z-tooltip:  400;
}

[data-theme="dark"], @media (prefers-color-scheme: dark) {
  :root {
    --ink:            #F5F4F2;
    --ink-soft:       #A8A29E;
    --ink-muted:      #6B6560;
    --ember:          #F59E0B;
    --ember-deep:     #D97706;
    --ember-wash:     rgba(245, 158, 11, 0.12);
    --ember-border:   rgba(245, 158, 11, 0.24);

    --bg:             #0C0C0B;
    --surface:        #1A1917;
    --surface-raised: #221F1C;
    --muted:          #292927;
    --border:         rgba(245, 244, 242, 0.10);
    --border-strong:  rgba(245, 244, 242, 0.18);
  }
}
```

---

*This document is the source of truth for all visual decisions in XQ Car Fleet. Update it when design decisions change — never let the code drift from the spec.*
