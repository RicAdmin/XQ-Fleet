# Plan: Car Fleet Management System

> Source PRD: [GitHub Issue #1](https://github.com/kenlck/xq-car-fleet-v2/issues/1) — XQ Car Fleet (Langkawi)

## Progress

| Stage | Title | Status |
|---|---|---|
| 1 | Foundation — Auth, Roles & Schema | ✅ Done |
| 2 | Car Inventory | 🔄 In progress |
| 3 | Customer Records | 🔲 Not started |
| 4 | Rental Lifecycle | 🔲 Not started |
| 5 | Internal Dashboard | 🔲 Not started |
| 6 | Reporting | 🔲 Not started |
| 7 | Document Generation | 🔲 Not started |
| 8 | Customer Portal — Browse & Car Photos | 🔲 Not started |
| 9 | Customer Portal — Accounts & Booking | 🔲 Not started |
| 10 | Online Payments — iPay88 | 🔲 Not started |
| 11 | Maintenance Lifecycle | 🔲 Not started |

> Status legend: 🔲 Not started · 🔄 In progress · ✅ Done

---

## Architectural Decisions

Durable decisions that apply across all stages:

- **Route namespaces**:
  - `/admin/*` — owner-only (reports, user management, car management)
  - `/app/*` — staff operations (dashboard, rentals, customers)
  - `/` — customer portal (public browse, car detail, booking flow)
  - `/account/*` — authenticated customer pages (booking history, booking detail)
  - `/api/auth/*` — Better Auth handler (existing)
  - `/api/webhooks/ipay88` — iPay88 payment callback (public POST, signature-verified)

- **Auth surfaces**: Better Auth with three roles — `owner`, `staff`, `customer`. Staff and owner share the internal login surface. Customers have a separate login/register surface. A customer session cannot access `/admin/*` or `/app/*` routes; a staff/owner session cannot access `/account/*`.

- **Schema tables**: `users`, `sessions` (Better Auth-managed), `cars`, `carPhotos`, `customers`, `rentals`, `payments`

- **Car status values**: `available` | `reserved` | `payment-pending` | `rented` | `maintenance` | `damaged` | `retired`. Transitions are enforced server-side; not all transitions are permitted (e.g. `rented` cannot jump directly to `retired`).

- **Rental status values**: `pending` | `active` | `closed` | `cancelled`

- **Overlap detection**: runs as an atomic query inside the rental creation transaction, checking `carId` + date range against existing `pending` and `active` rentals

- **iPay88 boundary**: payment initiation is a server function that builds and signs the iPay88 request; the gateway posts back to the webhook endpoint which verifies the signature before writing to the DB

- **All monetary amounts**: Malaysian Ringgit (MYR), stored as integers in sen (e.g. RM 100.00 = 10000)

---

## Stage 1: Foundation — Auth, Roles & Schema

**Status**: 🔲 Not started
**User stories**: 44, 45, 46, 47, 48, 54, 55

### What to build

Replace the placeholder `todos` schema with the full production schema. Set up Better Auth with three roles (`owner`, `staff`, `customer`) and wire up route-level guards so each role can only access its permitted namespace. Deliver working login and logout for all three role types with basic protected pages as proof.

The owner should be able to invite staff by email and set their role, and deactivate accounts. Staff and owner log in via the internal login page; customers log in via the portal login page. Sessions expire after a configurable inactivity period.

### Acceptance criteria

- [ ] Full DB schema is in place (`cars`, `carPhotos`, `customers`, `rentals`, `payments`) with migrations applied
- [ ] Better Auth is configured with `owner`, `staff`, and `customer` roles
- [ ] Owner can log in and access `/admin/*` routes; staff cannot reach `/admin/*`
- [ ] Staff can log in and access `/app/*` routes; customers cannot reach `/app/*`
- [ ] Customer can register and log in; their session cannot access `/admin/*` or `/app/*`
- [ ] Owner can invite a staff member by email and assign the `staff` role
- [ ] Owner can deactivate a staff account, immediately revoking their session
- [ ] Unauthenticated requests to protected routes redirect to the appropriate login page
- [ ] Sessions expire after inactivity (configurable timeout)

---

## Stage 2: Car Inventory

**Status**: ✅ Done
**User stories**: 6, 7, 8, 9, 10, 11, 12

### What to build

Owner-only CRUD for the car fleet. An owner can add, edit, and retire cars. Each car has a plate number, make, model, year, color, category (economy / MPV / SUV / other), and status. Status can be manually set to `maintenance` or `damaged` by the owner. Retiring a car sets status to `retired` without deleting its record. Staff can view car profiles and filter the list by status but cannot edit.

### Acceptance criteria

- [ ] Owner can create a car with all required fields (plate, make, model, year, color, category)
- [ ] Owner can edit any car's details
- [ ] Owner can manually set a car's status to `maintenance` or `damaged`
- [ ] Owner can retire a car (status = `retired`); the car no longer appears in active inventory but its record is preserved
- [ ] Staff can view the full car list filtered by status
- [ ] Staff can view a single car's profile
- [ ] Plate number is unique; duplicate plate numbers are rejected
- [ ] Car category values are constrained to the defined enum

---

## Stage 3: Customer Records

**Status**: 🔲 Not started
**User stories**: 13, 14, 15, 16

### What to build

Staff-accessible CRUD for customer records. A staff member can create a new customer with name, IC/passport number, phone, and address. The system prevents duplicate records by enforcing uniqueness on IC/passport. Staff can search for an existing customer by name or IC/passport. Owners can edit customer details.

### Acceptance criteria

- [ ] Staff can create a customer record with all required fields
- [ ] IC/passport number is unique; attempting to create a duplicate is rejected with a clear error
- [ ] Staff can search customers by name (partial match) or IC/passport number (exact match)
- [ ] Staff can view a customer's full profile and their rental history
- [ ] Owner can edit any customer's details
- [ ] IC/passport field accepts both Malaysian IC format (12-digit numeric) and foreign passport formats (alphanumeric)

---

## Stage 4: Rental Lifecycle

**Status**: 🔲 Not started
**User stories**: 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29

### What to build

The core rental workflow end-to-end. Staff can create an advance booking (car + customer + dates + daily rate) or a walk-in rental. The system prevents double-bookings via overlap detection. Staff can view upcoming reservations sorted by start date and cancel a pending booking.

At handover, staff confirm the rental by recording start mileage and a condition note; the car status transitions to `rented`. At return, staff close the rental by recording return mileage, a condition note, total amount paid, and payment status (unpaid / partial / paid); the car status transitions back to `available` (or `damaged` if issues are flagged). Owners can extend an active rental's end date.

### Acceptance criteria

- [ ] Staff can create a booking (type: `booking`) with car, customer, start date, end date, and daily rate
- [ ] Staff can create a walk-in rental (type: `walk-in`) with the same fields, immediately moving to handover
- [ ] Attempting to book a car with overlapping dates is rejected with a clear conflict error
- [ ] Staff can view all upcoming (pending) bookings sorted by start date
- [ ] Staff can cancel a pending booking; the car status returns to `available`
- [ ] Staff can confirm handover: records start mileage + condition note; car status → `rented`; rental status → `active`
- [ ] Staff can close a return: records end mileage, condition note, total paid, payment status; rental status → `closed`; car status → `available` (or `damaged` if condition notes flag damage)
- [ ] Owner can extend an active rental's end date
- [ ] Security deposit amount is recorded at handover
- [ ] Payment status (unpaid / partial / paid) is visible on the rental record

---

## Stage 5: Internal Dashboard

**Status**: 🔲 Not started
**User stories**: 1, 2, 3, 4, 5, 41, 42

### What to build

The primary screen for both staff (mobile) and owner (desktop). Shows a live fleet summary (count of cars by status: available, rented, reserved, maintenance, damaged). Lists rentals due back today. Lists overdue rentals (active rentals past their end date) with days overdue highlighted. Staff see this as their home screen; it should require minimal taps to reach a rental or car record.

### Acceptance criteria

- [ ] Dashboard shows real-time fleet summary counts by status
- [ ] "Due today" section lists all active rentals with a return date of today
- [ ] "Overdue" section lists all active rentals past their end date, sorted by most overdue first, with days overdue displayed
- [ ] Each item in due/overdue lists links directly to the rental detail
- [ ] Dashboard layout is optimised for mobile on the `/app` route
- [ ] Owner's dashboard at `/admin` shows the same data with an additional desktop-optimised layout

---

## Stage 6: Reporting

**Status**: 🔲 Not started
**User stories**: 34, 35, 36, 37, 38, 39, 40, 43

### What to build

Owner-only reports accessible from `/admin/reports`. Four report types:

1. **Revenue** — total income for a selected date range, with breakdowns by car category and by individual car. Shows outstanding balances (partially paid rentals).
2. **Utilization** — per-car utilization rate (days rented ÷ days available), total rentals per car, and average rental duration, for a selected period.
3. **Overdue** — list of all active rentals past their end date with days overdue (shared logic with dashboard but presented as a full report).
4. **Rental history** — paginated list of all rentals for a selected car.

### Acceptance criteria

- [ ] All reports are accessible only to the `owner` role
- [ ] Revenue report: owner can select a date range and see total revenue, breakdown by category, breakdown by individual car
- [ ] Revenue report: outstanding balances (partial payment rentals) are listed separately
- [ ] Utilization report: shows utilization rate, rental count, and average duration per car for the selected period
- [ ] Rental history report: paginated full rental log for any selected car
- [ ] Overdue report: all active rentals past due date with days overdue

---

## Stage 7: Document Generation

**Status**: 🔲 Not started
**User stories**: 30, 31, 32, 33

### What to build

Server-rendered printable documents. Two document types:

1. **Rental agreement** — generated when a handover is confirmed. Includes car details, customer details, rental dates, daily rate, total amount, and deposit amount.
2. **Invoice** — generated when a rental is closed. Includes itemised charges, total amount, deposit deducted, and outstanding balance.

Both are rendered server-side as HTML and served as print-optimised pages (CSS `@media print` or downloadable PDF).

### Acceptance criteria

- [ ] Staff can generate a rental agreement from the handover confirmation screen
- [ ] Staff can generate an invoice from the rental close screen
- [ ] Rental agreement includes: car plate/make/model, customer name/IC/phone, start and end dates, daily rate, total amount, deposit amount
- [ ] Invoice includes: rental dates, daily rate, number of days, total charge, deposit collected, balance due
- [ ] Both documents are printable (print-optimised layout)
- [ ] Documents can be opened in a new tab for printing or saving

---

## Stage 8: Customer Portal — Browse & Car Photos

**Status**: 🔲 Not started
**User stories**: 49, 50, 51, 52, 53, 62, 63, 64

### What to build

The public-facing customer portal landing page at `/`. Visitors can browse all non-retired cars with their cover photo, make, model, category, and daily rate. They can filter by category. They can enter pickup and return dates to see only cars available for those dates and get an estimated total cost.

In the owner admin panel, owners can upload multiple photos per car, designate a cover photo, and delete photos. Photos are stored in object storage; the DB stores metadata (URL, order, isCover).

### Acceptance criteria

- [ ] Landing page is publicly accessible (no login required)
- [ ] All active (non-retired) cars are listed with cover photo, make, model, category, and daily rate
- [ ] Visitor can filter cars by category
- [ ] Visitor can enter pickup and return dates; only cars with no overlapping confirmed rentals are shown
- [ ] Estimated total cost (daily rate × days) is displayed per car when dates are selected
- [ ] Owner can upload multiple photos per car from the admin panel
- [ ] Owner can set a cover photo; it appears as the listing thumbnail
- [ ] Owner can delete photos
- [ ] Cars with no photos show a placeholder image

---

## Stage 9: Customer Portal — Accounts & Booking

**Status**: 🔲 Not started
**User stories**: 54, 55, 56, 57 (redirect only), 58, 59, 60, 61

### What to build

Customer registration and login on the portal. Once logged in, a customer can complete the booking flow: select a car, pick dates, provide their personal details (name, IC/passport, phone, address), and submit the booking. After submission the booking is placed in `pending` status and the customer is redirected to iPay88 (handled in Stage 10). On return from payment, the customer sees a confirmation screen. Customers can view their bookings and see the current status of each.

### Acceptance criteria

- [ ] Customer can register with email and password from the portal
- [ ] Customer can log in and log out
- [ ] Logged-in customer can initiate a booking from a car listing
- [ ] Booking form collects: car, dates, name, IC/passport, phone, address, and confirmed total
- [ ] On form submission, a rental record is created with status `pending` and car is held (`payment-pending`)
- [ ] Customer is redirected toward payment (iPay88 integration wired in Stage 10; a stub "pay now" button is sufficient here)
- [ ] Customer can view all their bookings at `/account/bookings`
- [ ] Each booking shows status: pending payment / confirmed / active / completed
- [ ] Booking detail page shows car, dates, amount, and current status

---

## Stage 10: Online Payments — iPay88

**Status**: 🔲 Not started
**User stories**: 65, 66, 67, 68, 69, 70

### What to build

Full iPay88 integration. Payment initiation: a server function builds and signs the iPay88 payment request (amount, reference, description, callback URLs) and redirects the customer. Payment callback: iPay88 posts to `/api/webhooks/ipay88`; the server verifies the signature, records the transaction in the `payments` table, updates the rental's `paymentStatus`, and transitions the booking to `confirmed` (car status → `reserved`).

Booking hold: when a rental is created from the portal, the car is set to `payment-pending`. A background job (or lazy expiry check on read) releases the hold and cancels the rental if payment is not completed within the configurable window (default 15 minutes). Failed/abandoned payments leave the rental in `pending` status until the hold expires.

Owner can configure per-booking whether full payment or deposit only is charged online.

### Acceptance criteria

- [ ] Clicking "pay now" on a portal booking initiates a signed iPay88 payment request and redirects to the iPay88 gateway
- [ ] iPay88 sandbox mode is supported for testing without live credentials
- [ ] A successful iPay88 callback: verifies signature, records transaction in `payments`, sets rental status → confirmed, sets car status → `reserved`, updates `paymentStatus` on the rental
- [ ] A failed or abandoned payment: rental stays `pending`; car hold expires after the configured window and car returns to `available`
- [ ] Every iPay88 payment attempt is recorded with: `ipay88RefNo`, amount, payment method, status, and timestamp
- [ ] Staff can see payment status (unpaid / deposit paid / fully paid) on each rental in the internal system
- [ ] Owner can configure whether full amount or deposit only is charged at booking time
- [ ] Replayed or tampered webhook requests are rejected (signature verification fails gracefully)
- [ ] Customer sees a confirmation screen after successful payment

---

## Stage 11: Maintenance Lifecycle

**Status**: 🔲 Not started
**User stories**: (new — no PRD user stories yet; to be added to PRD)

### What to build

A full maintenance tracking and predictive alerting system for the fleet. Covers four event types: scheduled service, unscheduled repairs, accident/damage repair, and road tax & insurance renewals.

**Logging a maintenance event**: any staff or owner can log a maintenance event against a car. Recording: event type, description, mileage at service, cost (MYR), and workshop/vendor name. When a maintenance event is created, the car status automatically transitions to `maintenance`, blocking new bookings. When the event is closed (marked complete), the car automatically returns to `available`.

**Service schedule & predictive maintenance**: each car has a configurable default service interval (in km and/or days). After closing a scheduled service event, the next service due date and mileage are automatically calculated from the interval. Staff can override the next-due values on a per-event basis. The system raises an alert when a car approaches its next service threshold — triggered by whichever comes first: within X km of the mileage threshold, or within X days of the due date.

**Road tax & insurance renewals**: tracked per car with expiry date, renewal cost, and policy/reference number. Alerts fire X days before expiry (configurable per type, default 30 days).

**Alerts**: upcoming and overdue maintenance alerts appear on the internal dashboard (alongside rental overdue alerts) and on a dedicated `/app/maintenance` page listing all cars with outstanding or approaching maintenance items.

**Maintenance cost reporting**: maintenance costs feed into the financial reports as expenses (alongside rental revenue) and are also surfaced in a dedicated maintenance cost report showing costs per car, per event type, and per period.

### Schema additions

- `maintenanceEvents`: `id`, `carId`, `type` (scheduled | unscheduled | damage | road-tax | insurance), `description`, `mileageAtService`, `cost`, `workshopVendor`, `status` (open | completed), `openedAt`, `completedAt`, `nextDueMileage`, `nextDueDate`, `createdBy`
- `carServiceConfig`: `carId`, `serviceIntervalKm`, `serviceIntervalDays`, `roadTaxExpiryDate`, `roadTaxPolicyRef`, `insuranceExpiryDate`, `insurancePolicyRef`

### Acceptance criteria

- [ ] Staff and owner can log a maintenance event (all four types) against any car
- [ ] Creating a maintenance event automatically sets car status → `maintenance`
- [ ] Closing a maintenance event automatically sets car status → `available`
- [ ] Each event records: type, description, mileage, cost, workshop/vendor, opened and closed timestamps
- [ ] Each car has a configurable service interval (km and/or days)
- [ ] After closing a scheduled service, next-due mileage and date are auto-calculated from the interval; staff can override
- [ ] Dashboard shows an alert for any car within the predictive threshold (approaching service due by mileage or date)
- [ ] Dashboard shows an alert for any car whose road tax or insurance is within 30 days of expiry (configurable)
- [ ] Dedicated maintenance page (`/app/maintenance`) lists all cars with open events, upcoming alerts, and overdue items
- [ ] Maintenance costs appear as expenses in the owner's financial report (reducing net revenue)
- [ ] A dedicated maintenance report shows total cost per car, breakdown by event type, and costs over a selected date range
- [ ] Road tax and insurance renewals are tracked with expiry date, cost, and policy/reference number per car
- [ ] Overdue maintenance items (past due date or past due mileage) are flagged distinctly from upcoming items
