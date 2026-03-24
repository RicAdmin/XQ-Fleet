# PRD: Car Fleet Management System — XQ Car Fleet (Langkawi)

## Problem Statement

A travel agency in Langkawi operates a car rental fleet and currently tracks all rentals, car status, and customer records using paper and pen. This creates several problems:
- No real-time visibility into which cars are available, rented out, reserved, or under maintenance
- No way to quickly check what is due back today or which cars are overdue
- No financial reporting — revenue figures must be manually tallied
- Rental history per car is buried in paper records
- Mistakes (double-booking, lost records) are hard to catch and correct

## Solution

A web-based car fleet management system with two distinct surfaces:

1. **Internal staff system** — gives the agency a live dashboard of their entire fleet, a structured workflow for logging and closing rentals, and reports that surface revenue, utilization, and overdue returns — replacing paper and pen entirely.

2. **Customer-facing portal** — a public landing page where customers can browse the fleet, create an account, place a booking, pay online via iPay88, and track their booking status.

The internal system has two user roles:
- **Owner/Admin** — full access including financial reports, car management, and user management. Primarily desktop.
- **Staff/Operator** — day-to-day rental operations (create rentals, handle handovers, close returns). Primarily mobile.

---

## User Stories

### Fleet Dashboard
1. As an owner, I want to see all cars and their current status on a single screen, so that I can understand the state of my fleet at a glance.
2. As a staff member, I want to quickly see which cars are available right now, so that I can answer a walk-in customer immediately.
3. As an owner, I want to see how many cars are available, rented, reserved, and under maintenance at any time, so that I can make operational decisions.
4. As a staff member, I want to see which rentals are due back today, so that I can follow up with customers proactively.
5. As an owner, I want to see overdue rentals highlighted on the dashboard, so that I can take action immediately.

### Car Inventory Management
6. As an owner, I want to add a new car to the fleet with its plate number, make, model, year, color, and category, so that it can be tracked in the system.
7. As an owner, I want to edit car details if information changes (e.g. re-registration, repainting), so that records stay accurate.
8. As an owner, I want to mark a car as retired/decommissioned, so that it is removed from active inventory without deleting its rental history.
9. As an owner, I want to assign a car category (e.g. economy, MPV, SUV), so that pricing tiers can be associated with car types.
10. As a staff member, I want to view a car's full profile including its current status and recent rental history, so that I can answer customer enquiries about a specific car.
11. As an owner, I want to manually change a car's status to "under maintenance" or "damaged", so that staff know not to assign it to new rentals.
12. As an owner, I want to see all cars filtered by status, so that I can quickly list all cars that are available, rented, or in maintenance.

### Customer Management
13. As a staff member, I want to create a customer record with name, IC/passport number, phone number, and address, so that their details are saved for the rental.
14. As a staff member, I want to search for an existing customer by name or IC/passport number, so that I do not duplicate records for repeat customers.
15. As a staff member, I want to view a customer's rental history, so that I can quickly identify repeat or problematic customers.
16. As an owner, I want to edit customer details if there is a correction or update.

### Rental Lifecycle — Booking & Walk-in
17. As a staff member, I want to create an advance booking for a customer with a car assigned, start date, end date, and agreed daily rate, so that the car is reserved ahead of time.
18. As a staff member, I want to create a walk-in rental on the spot, so that I can handle customers who arrive without a reservation.
19. As a staff member, I want the system to prevent me from booking a car that is already reserved or rented for overlapping dates, so that double-bookings are impossible.
20. As a staff member, I want to see all upcoming reservations in a list ordered by start date, so that I can prepare cars in advance.
21. As a staff member, I want to cancel a reservation before handover, so that the car becomes available again.

### Rental Lifecycle — Handover
22. As a staff member, I want to confirm a handover by recording the actual start mileage and a condition note, so that the car's state at departure is documented.
23. As a staff member, I want to record the security deposit amount collected at handover, so that it is tracked against the rental.
24. As a staff member, I want the car's status to automatically change to "rented out" when I confirm a handover, so that the fleet dashboard is always up to date.

### Rental Lifecycle — Return
25. As a staff member, I want to close a rental by recording the return mileage and a condition note, so that the car's state at return is documented.
26. As a staff member, I want to record the total amount paid when closing a rental, so that payment status is captured.
27. As a staff member, I want to mark a rental as fully paid or partially paid, so that outstanding balances are visible.
28. As a staff member, I want the car's status to automatically return to "available" (or "damaged" if issues are noted) when I close a rental, so that the fleet dashboard updates immediately.
29. As an owner, I want to extend an active rental's end date, so that I can accommodate customers who need the car for longer.

### Document Generation
30. As a staff member, I want to generate a printable rental agreement for a customer at handover, so that both parties have a signed record.
31. As a staff member, I want to generate a printable invoice for a customer when closing a rental, so that the customer receives proof of payment.
32. As an owner, I want the rental agreement to include car details, customer details, rental dates, daily rate, total amount, and deposit, so that it is legally sufficient.
33. As an owner, I want the invoice to include itemised charges, total amount, deposit deducted, and balance, so that it is clear and professional.

### Reporting — Revenue
34. As an owner, I want to see total revenue for any selected date range (day, month, year), so that I know how much income was generated.
35. As an owner, I want to see a revenue breakdown by car category, so that I can compare which segments perform best.
36. As an owner, I want to see a revenue breakdown by individual car, so that I can identify high and low earners.
37. As an owner, I want to see outstanding balances (partially paid rentals), so that I know how much money is still owed.

### Reporting — Utilization
38. As an owner, I want to see the utilization rate of each car (days rented ÷ days available) for a given period, so that I can identify underused cars.
39. As an owner, I want to see the total number of rentals per car in a given period, so that I can compare car popularity.
40. As an owner, I want to see average rental duration across all cars, so that I can understand typical usage patterns.

### Reporting — Overdue & Operational
41. As an owner, I want to see a list of all rentals that are past their due return date and not yet closed, so that I can follow up immediately.
42. As a staff member, I want to see overdue rentals flagged on the dashboard with the number of days overdue, so that I know which customers to contact.
43. As an owner, I want to see the full rental history of any individual car, so that I can review its complete usage record.

### Authentication & Roles
44. As an owner, I want to invite staff members by email and assign them the staff role, so that they can access the system.
45. As an owner, I want staff accounts to be restricted from accessing financial reports and car management, so that sensitive data is protected.
46. As an owner, I want to deactivate a staff account when they leave, so that they lose access immediately.
47. As a user, I want to log in with an email and password, so that my session is secure.
48. As a user, I want to be logged out after a period of inactivity, so that an unattended device does not expose data.

### Customer Portal — Browsing & Discovery
49. As a customer, I want to browse all available cars on a public landing page without logging in, so that I can explore options before committing to a booking.
50. As a customer, I want to see photos, make, model, category, and daily rate for each car, so that I can compare options.
51. As a customer, I want to filter cars by category (economy, MPV, SUV), so that I can narrow down to what suits my needs.
52. As a customer, I want to enter my desired pickup and return dates and see only cars available for those dates, so that I do not attempt to book an unavailable car.
53. As a customer, I want to see the estimated total cost based on my selected dates, so that I know exactly what I will pay before confirming.

### Customer Portal — Account & Booking
54. As a customer, I want to register an account with my email and password, so that I can make and track bookings.
55. As a customer, I want to log in to my account, so that I can access my booking history.
56. As a customer, I want to submit a booking by selecting a car, entering my dates, and providing my personal details (name, IC/passport, phone, address), so that the agency has everything they need.
57. As a customer, I want to be redirected to iPay88 to complete payment after submitting my booking, so that I can secure my reservation online.
58. As a customer, I want my booking to be confirmed automatically once my payment is successful, so that I receive immediate confirmation.
59. As a customer, I want to receive a booking confirmation on-screen after payment, so that I have a reference for my trip.
60. As a customer, I want to view my active and past bookings in my account, so that I can track my rental status.
61. As a customer, I want to see whether my booking is pending payment, confirmed, active, or completed, so that I always know where things stand.

### Customer Portal — Car Photos
62. As an owner, I want to upload multiple photos per car in the admin panel, so that customers see accurate photos on the portal.
63. As an owner, I want to set a cover photo for each car, so that the listing thumbnail is the most attractive image.
64. As an owner, I want to delete or replace photos for a car, so that outdated images do not mislead customers.

### Online Payments — iPay88
65. As a customer, I want to pay via credit/debit card, FPX online banking, or eWallet through iPay88, so that I can use my preferred payment method.
66. As an owner, I want to configure whether a booking requires full payment or a deposit only, so that I can adjust the payment policy per situation.
67. As a staff member, I want to see the payment status of every booking (unpaid, deposit paid, fully paid) in the internal system, so that I know what to collect at handover.
68. As an owner, I want failed or abandoned iPay88 payments to leave the booking in a "pending payment" state, so that the car remains holdable for a short window before releasing back to available.
69. As an owner, I want the system to record the iPay88 transaction reference for every payment, so that I can reconcile payments if needed.
70. As an owner, I want online payments to automatically update the rental's payment status in the internal system, so that staff see the correct balance due at handover without manual entry.

---

## Implementation Decisions

### Modules

**1. Auth & Role Module**
- Built on Better Auth (already in the stack)
- Two roles: `owner` and `staff`
- Role stored on the user record; enforced server-side on all API calls
- Owner can invite users by email and set role; can deactivate accounts
- Session expiry configured for inactivity timeout

**2. Car Inventory Module**
- Car entity: `id`, `plateNumber`, `make`, `model`, `year`, `color`, `category` (enum: economy, MPV, SUV, others), `status` (enum: available, reserved, rented, maintenance, damaged, retired), `createdAt`, `updatedAt`
- Status transitions are enforced via a state machine — not all transitions are allowed (e.g. cannot go from `rented` directly to `retired`)
- Soft-delete for retired cars: `status = retired` keeps history intact

**3. Customer Module**
- Customer entity: `id`, `fullName`, `icOrPassport`, `phone`, `address`, `createdAt`
- Unique constraint on `icOrPassport` to prevent duplicates
- Search by name or IC/passport

**4. Rental Module**
- Rental entity: `id`, `carId`, `customerId`, `type` (booking | walk-in), `status` (pending | active | closed | cancelled), `startDate`, `endDate`, `actualReturnDate`, `dailyRate`, `totalAmount`, `depositAmount`, `depositReturned`, `paymentStatus` (unpaid | partial | paid), `startMileage`, `endMileage`, `startConditionNote`, `endConditionNote`, `createdBy`, `createdAt`, `updatedAt`
- Overlap detection query runs on `carId` + date range before any rental is committed
- Status transitions: pending → active (handover), active → closed (return), pending → cancelled

**5. Dashboard Module**
- Server-computed fleet summary counts (available, rented, reserved, maintenance, damaged)
- List of today's due returns
- List of overdue rentals (past `endDate`, status still `active`)
- Optimised for mobile layout for staff; richer grid layout for owner on desktop

**6. Reporting Module**
- Revenue report: aggregates closed rentals by date range; breakdowns by category and by car
- Utilization report: per-car days rented vs days available in period
- Overdue report: active rentals past end date with days overdue
- Rental history: paginated list for a specific car
- All reports are owner-only; accessible via server functions that check role

**7. Document Generation Module**
- Rental agreement: generated at handover confirmation
- Invoice: generated at rental close
- Rendered server-side as HTML, served as printable page or downloadable PDF
- Templates include: client branding, car details, customer details, dates, financials

**8. Customer Portal Module**
- Public-facing pages: landing/browse, car detail, booking flow (date selection → account login/register → payment)
- Authenticated pages: booking history, booking detail
- Customer accounts are a separate role (`customer`) managed by Better Auth; fully isolated from staff/owner accounts
- Car availability check on the portal uses the same overlap detection as the internal system
- Estimated total cost computed client-side from daily rate × selected days

**9. Online Payment Module (iPay88)**
- Integration with iPay88 payment gateway
- Payment initiation: server function generates a signed iPay88 request and redirects customer
- Payment callback: iPay88 posts to a webhook endpoint; server verifies signature, updates rental `paymentStatus`, and triggers booking confirmation
- Booking holds: when a customer submits a booking, the car is placed in a short-term `payment-pending` hold; if payment is not completed within a configurable window (e.g. 15 minutes), the hold expires and the car is released
- Transaction records: every iPay88 payment attempt is stored with reference number, amount, status, and timestamp for reconciliation
- Owner configures per-booking whether full amount or deposit only is charged online; remainder is tracked as balance due at handover

**10. Car Photo Module**
- Photos stored in object storage (e.g. S3-compatible); DB stores metadata (carId, url, order, isCover)
- Multiple photos per car; one designated as cover photo for listing thumbnail
- Upload, reorder, and delete via owner admin panel
- Photos served via CDN-friendly URLs

### API Design
- All data mutations are TanStack Start server functions
- Role enforcement is a middleware wrapper on all owner-only server functions
- Overlap check is an atomic DB query within the rental creation transaction
- iPay88 webhook is a public POST endpoint with signature verification before any DB writes

### Schema Summary
- Tables: `users`, `sessions` (Better Auth managed), `cars`, `carPhotos`, `customers`, `rentals`, `payments`
- `cars.status` updated automatically on rental state transitions via server-side logic (not DB triggers)
- `payments` table records each iPay88 transaction: `id`, `rentalId`, `ipay88RefNo`, `amount`, `currency`, `status`, `paymentMethod`, `respondedAt`

---

## Testing Decisions

**What makes a good test:**
- Test external behavior only — what the module returns given an input, not how it computes it internally
- Tests should be runnable without a real browser (Vitest for server logic; Testing Library for UI components)
- Each test should set up its own data and not rely on shared global state

**Modules to test:**

1. **Rental overlap detection** — unit test the query/function that checks for date conflicts; test cases: exact overlap, partial overlap, adjacent (no overlap), same car vs different car
2. **Car status state machine** — unit test all allowed and disallowed transitions
3. **Rental lifecycle transitions** — integration test the full flow: create booking → confirm handover → close return; verify car status updates correctly at each step
4. **Role enforcement** — integration test that staff cannot access owner-only server functions; customer accounts cannot access internal staff routes
5. **Revenue report aggregation** — unit test the revenue calculation logic given a fixed set of rental records
6. **iPay88 webhook handler** — unit test signature verification (valid signature, tampered signature, replayed request); integration test that a successful callback correctly updates rental payment status and releases the booking hold
7. **Booking hold expiry** — unit test that a car held for payment returns to available status after the hold window expires without payment
8. **Portal availability check** — integration test that the portal's car availability query correctly excludes cars with overlapping confirmed bookings

---

## Out of Scope

- Integration with external booking platforms (Agoda, Booking.com)
- WhatsApp or SMS notifications
- Integration with accounting software
- Driver/chauffeur management
- Fuel tracking beyond condition notes
- Multi-branch/multi-location support
- Customer self-serve cancellation (no refunds policy; cancellations handled by staff)
- Refunds via iPay88 (all online payments are non-refundable; any exceptions handled offline)

---

## Further Notes

- The app must be fully responsive — staff will primarily use mobile phones for day-to-day operations; owner will use desktop for reports and administration
- The car dashboard is the primary entry point for staff; it should be fast and require minimal taps to start a rental or close a return
- Langkawi context: customer base includes tourists with foreign passports, so IC/passport field must accept both Malaysian IC format and foreign passport numbers
- Document generation (rental agreement + invoice) is a requirement for v1 since it replaces paper forms currently in use
- Roughly ~10–100 cars in the fleet based on a small Langkawi agency; performance is not a concern at this scale
- iPay88 integration requires a merchant account and sandbox credentials for testing; the payment module should be fully testable in sandbox mode before going live
- The customer portal and the internal staff system share the same database but have separate authentication surfaces — customer accounts cannot log into the staff panel and vice versa
- Booking hold window (time allowed to complete payment before the car is released) should be owner-configurable; default 15 minutes
- All monetary amounts are in Malaysian Ringgit (MYR)
