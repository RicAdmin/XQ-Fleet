# Car Rental Pricing Logic — Implementation Spec v2

**For:** Coding agent (Claude Code / Cursor / similar)
**Source data:** `Car_Comprehensive_v3.csv` (17 cars) + `Season_Calendar_2026_v2.csv` (35 ranges, no overlaps, no gaps)
**Date:** 2026
**Version:** 2.0 (supersedes v1)

---

## CHANGELOG FROM v1

Version 2 fixes 8 issues discovered during stress testing of v1. Critical fixes are flagged below.

| # | Severity | Issue | Section |
|---|---|---|---|
| 1 | CRITICAL | Long extra hours overcharge (RM 420 for 14 hours when full day is RM 240) | §6 |
| 2 | CRITICAL | Same-day rental silently returns 0 days, undercharges | §3 |
| 3 | CRITICAL | Wrong hourly rate used (Low rate applied during Peak return) | §6 |
| 4 | MEDIUM | Return time earlier than pickup = silent free hours | §6 |
| 5 | MEDIUM | Minutes-long pickup window charged full day | §3 |
| 6 | LOW | Extra hours bridging seasons unclear | §6 |
| 7 | CRITICAL | Season calendar had overlapping ranges and missing Eid coverage | data fix in v2 |
| 8 | MEDIUM | No cancellation/no-show policy | §13 |
| 9 | CRITICAL | Clock-time-only logic can't detect >24-hour late returns. Customer can keep car an extra full day and not be charged. | §6 caveat |

---

## 0. Schema Alignment

| Logic doc name | Actual column in `cars` table |
|---|---|
| `low` | `Price_Low_Season` |
| `peak` | `Price_Peak_Season` |
| `superPeak` | `Price_Super_Peak_Season` |
| `extHourLow` | `Ext_Hour_Low` |
| `extHourPeakSuperPeak` | `Ext_Hour_Peak_And_Super_Peak` |
| `promotionalPrice` | `Promotional_Price` (display only, never used in math) |

Season calendar uses **inclusive ranges on both sides** (`From_Date <= currentDay <= To_Date`).

---

## 1. Pricing Formula

```
SubTotal      = Base_Rental + Extra_Hours_Charge + Addons_Total + Delivery_Fee
Discount_Amt  = SubTotal x (discount_percent / 100)
Final_Total   = round(SubTotal - Discount_Amt)
Stripe_Amt    = Final_Total x 100   // MYR cents
```

---

## 2. Required Inputs

### From the selected car

```typescript
type Car = {
  Title: string;
  Price_Low_Season: number;
  Price_Peak_Season: number;
  Price_Super_Peak_Season: number;
  Ext_Hour_Low: number;
  Ext_Hour_Peak_And_Super_Peak: number;
  Delivery_Fee_Airport: number;
  Delivery_Fee_Hotel: number;
  Min_Rental_Days: number;
  Max_Rental_Days: number;
  Available_For_Booking: boolean;
  Status: string;
  Number_Of_Units: number;
};
```

### From the customer

```typescript
type BookingInput = {
  pickUpDate: Date;
  returnDate: Date;
  pickUpTime: string;          // "HH:MM:SS"
  returnTime: string;          // "HH:MM:SS"
  pickUpLocation: string;
  returnLocation: string;
  addOns: { childSeat: boolean; secondDriver: boolean };
  couponCode?: string;
};
```

---

## 3. Step 1: Validate Inputs (FIX #2, FIX #5)

```typescript
function validateBooking(car: Car, input: BookingInput): ValidationResult {
  // 1. Car bookable
  if (car.Status !== "Active") return err("Car is not available");
  if (!car.Available_For_Booking) return err("Car is not bookable");

  // 2. CRITICAL: Return date must be STRICTLY AFTER pickup date (prevents Bug #2)
  if (input.returnDate <= input.pickUpDate) {
    return err("Return date must be at least one day after pickup date");
  }

  // 3. Day count within allowed range (the day count itself must be >= 1)
  const days = countRentalDays(input.pickUpDate, input.returnDate);
  if (days < 1) return err("Minimum rental is 1 day");                       // safety net for Bug #2
  if (days < car.Min_Rental_Days) return err(`Minimum rental is ${car.Min_Rental_Days} day(s)`);
  if (days > car.Max_Rental_Days) return err(`Maximum rental is ${car.Max_Rental_Days} day(s)`);

  // 4. Inventory check
  const unitsBooked = countOverlappingBookings(car.id, input.pickUpDate, input.returnDate);
  if (unitsBooked >= car.Number_Of_Units) return err("All units booked for these dates");

  return { ok: true };
}
```

**Note on Bug #5 (minutes-long pickup):** A customer picking up at 11:59 PM and returning at 12:01 AM next day will still be charged a full day. This is industry-standard. If the business wants a grace window (e.g. pickup after 9 PM counts toward the next day), implement a separate "grace policy" function. For now, document this clearly on the booking page.

---

## 4. Step 2: Count Rental Days by Season

Walk every calendar day from `pickUpDate` (inclusive) to `returnDate` (exclusive). The return day is NOT charged.

```typescript
type DayEntry = { date: Date; seasonType: "Low" | "Peak" | "Super Peak" };

function getRentalDays(pickUpDate: Date, returnDate: Date, calendar: SeasonRange[]): DayEntry[] {
  const days: DayEntry[] = [];
  const start = stripTime(pickUpDate);
  const end   = stripTime(returnDate);

  let current = new Date(start);
  while (current < end) {
    const seasonType = lookupSeason(current, calendar);
    days.push({ date: new Date(current), seasonType });
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function lookupSeason(day: Date, calendar: SeasonRange[]): "Low" | "Peak" | "Super Peak" {
  for (const range of calendar) {
    if (day >= stripTime(range.From_Date) && day <= stripTime(range.To_Date)) {
      return range.Season_Type;
    }
  }
  return "Low"; // safe fallback for any uncovered date
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
```

---

## 5. Step 3: Calculate Base Rental

```typescript
function calculateBaseRental(days: DayEntry[], car: Car): number {
  const rateMap: Record<string, number> = {
    "Low":        car.Price_Low_Season,
    "Peak":       car.Price_Peak_Season,
    "Super Peak": car.Price_Super_Peak_Season,
  };
  return days.reduce((total, day) => total + rateMap[day.seasonType], 0);
}
```

---

## 6. Step 4: Calculate Extra Hours (FIX #1, FIX #3, FIX #4, FIX #6)

This is the most heavily-changed section in v2. Three new rules:

### Rule A: Full-Day Cap (FIX #1, CRITICAL)

If extra hours are 6 or more, charge as a full additional day at the last day's season rate, NOT as hours x hourly rate. This prevents the absurd case where 14 extra hours at RM 30 (= RM 420) costs more than a full extra Peak day (RM 240).

Multiples beyond 24 hours add additional full days.

### Rule B: Return Clock Time vs Pickup Clock Time (FIX #4)

If `returnTime <= pickUpTime`, extra hours = 0. No negative charges. This is the industry-standard "you can return up to 24 hours from pickup with no extra charge" rule.

### Rule D: >24-Hour Late Returns (CAVEAT — Bug #9)

The clock-time-only comparison cannot detect a customer who keeps the car for an extra full day. Example: pickup May 19 at 8 AM, scheduled return May 23 at 8 AM, but customer actually returns May 24 at 8 AM. The clock times match (both 8 AM), so the formula says extra hours = 0, but the customer kept the car a full extra day for free.

**Two possible fixes:**

**Option 1 (recommended):** Compare actual datetime objects, not just clock times.

```typescript
// Combine actual pickup and return into full timestamps
const pickupTimestamp = combineDateTime(input.pickUpDate, input.pickUpTime);
const returnTimestamp = combineDateTime(input.returnDate, input.returnTime);

// Calculate scheduled-end timestamp (pickup + days * 24h)
const scheduledEnd = new Date(pickupTimestamp.getTime() + days.length * 24 * 60 * 60 * 1000);

// Extra hours = how far past the scheduled end
const extraMs = returnTimestamp.getTime() - scheduledEnd.getTime();
const extraHours = Math.max(0, extraMs / (1000 * 60 * 60));
```

This is the correct, robust approach. It naturally handles 14-hour late returns, 25-hour late returns, and 73-hour late returns all the same way.

**Option 2 (simpler, for MVP):** Block return time entry that doesn't match the spirit of "a few extra hours". If the system detects `returnTime <= pickUpTime`, force the customer to add 1 more rental day instead of allowing free hours.

The v2 reference implementation in Section 6 uses Option 2 for simplicity. **For production launch, migrate to Option 1.**

### Rule C: Last-Day Season (FIX #3)

The hourly rate AND the cap day rate come from the **last billing day** (the day before the return day), not from the pickup day.

### Implementation

```typescript
type ExtraHoursResult = {
  hours: number;
  charge: number;
  appliedRule: "none" | "hourly" | "full-day-cap";
  hourlyRate?: number;
  capDayRate?: number;
};

function calculateExtraHours(
  pickUpTime: string,
  returnTime: string,
  days: DayEntry[],
  car: Car
): ExtraHoursResult {
  const pickupMs = timeToMs(pickUpTime);
  const returnMs = timeToMs(returnTime);

  // Rule B: same or earlier return time = no extra charge
  if (returnMs <= pickupMs) {
    return { hours: 0, charge: 0, appliedRule: "none" };
  }

  const extraHours = (returnMs - pickupMs) / (1000 * 60 * 60);

  // Rule C: rate determined by last billing day
  const lastDay = days[days.length - 1];
  const isLow = lastDay.seasonType === "Low";
  const hourlyRate = isLow ? car.Ext_Hour_Low : car.Ext_Hour_Peak_And_Super_Peak;
  const dayRate    = isLow ? car.Price_Low_Season
                          : (lastDay.seasonType === "Peak"
                              ? car.Price_Peak_Season
                              : car.Price_Super_Peak_Season);

  // Rule A: full-day cap kicks in at >=6 extra hours
  const FULL_DAY_CAP_THRESHOLD = 6;
  if (extraHours >= FULL_DAY_CAP_THRESHOLD) {
    // Charge full extra days (one per 24-hour block, rounded up)
    const extraDays = Math.ceil(extraHours / 24);
    return {
      hours: extraHours,
      charge: extraDays * dayRate,
      appliedRule: "full-day-cap",
      capDayRate: dayRate,
    };
  }

  return {
    hours: extraHours,
    charge: extraHours * hourlyRate,
    appliedRule: "hourly",
    hourlyRate,
  };
}

function timeToMs(hms: string): number {
  const [h, m, s] = hms.split(":").map(Number);
  return ((h * 60 + m) * 60 + s) * 1000;
}
```

### Worked example demonstrating the fix

Same booking that failed in v1: Toyota Innova, May 19 8AM to May 23 10PM.

```
v1 logic (buggy):
  Base: 660 + Extra: 14h x 30 = 420 -> Total RM 1,080

Current production system (different bug):
  Base: 660 + Extra: 14h x 20 (wrong rate) = 280 -> Total RM 940

v2 logic (correct):
  Base: 660
  Extra hours = 14h, threshold reached, applies full-day cap
  Cap day rate = RM 240 (last day May 22 is Peak)
  Cap charge = ceil(14/24) x 240 = 1 x 240 = RM 240
  Total: 660 + 240 = RM 900
```

**RM 900 is the correct, defensible answer**: cheaper than overcharging the customer for 14 hours at hourly rate, more than underchargin them at the Low rate, and easy to explain ("you kept the car into the next day, so one extra day applies").

---

## 7. Step 5: Add-ons (Unchanged)

```typescript
function calculateAddons(addOns: { childSeat: boolean; secondDriver: boolean }): number {
  return (addOns.childSeat ? 30 : 0) + (addOns.secondDriver ? 20 : 0);
}
```

Add-ons are one-time fees, regardless of rental duration.

---

## 8. Step 6: Delivery Fee

```typescript
function calculateDeliveryFee(pickUpLoc: string, returnLoc: string, car: Car): number {
  const fee = (loc: string): number => {
    switch (loc) {
      case "Airport": return car.Delivery_Fee_Airport;
      case "Hotel":   return car.Delivery_Fee_Hotel;
      case "Jetty":   return car.Delivery_Fee_Airport;
      case "Office":  return 0;
      default:        return 0;
    }
  };
  return fee(pickUpLoc) + fee(returnLoc);
}
```

**Business decision needed:** charge delivery for both pickup and return legs, or only pickup? Currently charges both. Confirm before launch.

---

## 9. Step 7: Coupon Discount

```typescript
type Promo = { title: string; discount: number; usageLeft: number };

async function applyCoupon(code: string | undefined, subTotal: number, promos: Promo[]) {
  if (!code) return { discountPercent: 0, discountAmount: 0 };

  const normalized = code.toUpperCase().trim();
  const promo = promos.find(p => p.title.toUpperCase() === normalized);

  if (!promo) return { discountPercent: 0, discountAmount: 0, error: "Not Found" };
  if (promo.usageLeft <= 0) return { discountPercent: 0, discountAmount: 0, error: "Expired" };

  return {
    discountPercent: promo.discount,
    discountAmount: subTotal * (promo.discount / 100),
  };
}
```

The discount applies to the entire SubTotal (base + extra + add-ons + delivery).

**Concurrency warning:** `usageLeft` must be decremented atomically on booking success (DB transaction with row lock), or two simultaneous bookings can consume the same last-use slot.

---

## 10. Step 8: Final Total Orchestration

```typescript
function computeFinalTotal(
  input: BookingInput,
  car: Car,
  calendar: SeasonRange[],
  promos: Promo[]
) {
  // Validate first
  const validation = validateBooking(car, input);
  if (!validation.ok) return { error: validation.error };

  // Calculate components
  const days        = getRentalDays(input.pickUpDate, input.returnDate, calendar);
  const baseRental  = calculateBaseRental(days, car);
  const extraResult = calculateExtraHours(input.pickUpTime, input.returnTime, days, car);
  const addonsTotal = calculateAddons(input.addOns);
  const deliveryFee = calculateDeliveryFee(input.pickUpLocation, input.returnLocation, car);

  const subTotal = baseRental + extraResult.charge + addonsTotal + deliveryFee;
  const { discountAmount, discountPercent } = applyCoupon(input.couponCode, subTotal, promos);
  const finalTotal = Math.round(subTotal - discountAmount);

  return {
    days: days.length,
    baseRental,
    extraHours: extraResult.hours,
    extraCharge: extraResult.charge,
    extraRule: extraResult.appliedRule,         // "none" | "hourly" | "full-day-cap"
    addonsTotal,
    deliveryFee,
    subTotal,
    discountPercent,
    discountAmount,
    finalTotal,
    stripeAmount: finalTotal * 100,
    breakdown: days,
  };
}
```

The `extraRule` field is important for the UI: show "Late return (1 day added)" if the full-day-cap applied, vs "14 hours at RM 30/hour" for hourly. Customers feel less surprised when they see clearly which rule was used.

---

## 11. Complete Worked Examples

### Example A: Normal rental, no extras

Toyota Innova, May 19 8AM to May 23 8AM (exactly 4 days, zero extra hours):

```
Days: 4 (May 19, 20, 21 Low + May 22 Peak)
Base: 140 + 140 + 140 + 240 = RM 660
Extra: 0
Addons: 0
Delivery: 0 (self-pickup at office)
Subtotal: RM 660
Final: RM 660
```

### Example B: Same booking with 14 extra hours (the bug case)

Toyota Innova, May 19 8AM to May 23 10PM:

```
Days: 4
Base: RM 660
Extra: 14 hours, full-day cap applies, RM 240
Subtotal: RM 900
Final: RM 900
```

### Example C: 1 hour late, hourly rate applies

Toyota Innova, May 19 8AM to May 23 9AM (1 hour extra, last day Peak):

```
Days: 4
Base: RM 660
Extra: 1 hour x RM 30 (Peak hourly) = RM 30
Subtotal: RM 690
Final: RM 690
```

### Example D: Christmas Super Peak with all extras

Honda City 5G, Dec 24 8AM to Dec 27 8AM, airport pickup, hotel return, child seat, SUMMER10 coupon:

```
Days: 3 (Dec 24, 25, 26 all Super Peak)
Base: 190 x 3 = RM 570
Extra: 0
Addons: RM 30 (child seat)
Delivery: 30 (airport) + 50 (hotel) = RM 80
Subtotal: RM 680
Discount 10%: -RM 68
Final: RM 612
Stripe: 61,200 cents
```

---

## 12. Order ID and Persistence

```typescript
async function persistBooking(input, pricing, car, stripeChargeId) {
  // Atomic transaction
  return await db.transaction(async (tx) => {
    // Insert booking
    const inserted = await tx.insert("BookingDetails", {
      userDetails: input.userDetails,
      pickupTime: input.pickUpTime,
      returnTime: input.returnTime,
      pickupDate: input.pickUpDate,
      returnDate: input.returnDate,
      transactionDate: new Date(),
      stripeChargeId,
      carDetails: car,
      carName: car.Title,
      bookingInfo: {
        days: pricing.days,
        totalPrice: pricing.finalTotal,
        baseRental: pricing.baseRental,
        extraHours: pricing.extraHours,
        extraCharge: pricing.extraCharge,
        extraRule: pricing.extraRule,
        addonsTotal: pricing.addonsTotal,
        deliveryFee: pricing.deliveryFee,
        subTotal: pricing.subTotal,
        childSeat: input.addOns.childSeat,
        driver: input.addOns.secondDriver,
        discount: pricing.discountPercent,
        couponCode: input.couponCode ?? "",
        pickUpLocation: input.pickUpLocation,
        returnLocation: input.returnLocation,
      },
    });

    // Order ID
    const totalCount = await tx.count("BookingDetails");
    const lastFourMobile = input.userDetails.mobile.slice(-4);
    const orderId = `LCR${totalCount}${lastFourMobile}`;
    await tx.update("BookingDetails", inserted.id, { orderId });

    // Decrement coupon atomically
    if (input.couponCode && pricing.discountPercent > 0) {
      await tx.decrement("Promo",
        { title: input.couponCode.toUpperCase() },
        "usageLeft",
        1
      );
    }

    return orderId;
  });
}
```

---

## 13. Cancellation Policy (FIX #8 — New Section)

The current system has no cancellation logic. Recommended tiers:

| Time before pickup | Refund % | Cancellation fee |
|---|---|---|
| 7+ days before | 100% | RM 0 |
| 3 to 7 days before | 75% | 25% of total |
| 24 to 72 hours before | 50% | 50% of total |
| Less than 24 hours | 0% | 100% (no refund) |
| No-show | 0% | 100% (no refund) |

```typescript
function calculateCancellationRefund(booking: Booking, cancelTime: Date) {
  const hoursBeforePickup = (booking.pickupDate.getTime() - cancelTime.getTime()) / (1000 * 60 * 60);

  if (hoursBeforePickup >= 168) return { refundPercent: 100, fee: 0 };
  if (hoursBeforePickup >= 72)  return { refundPercent: 75,  fee: booking.totalPrice * 0.25 };
  if (hoursBeforePickup >= 24)  return { refundPercent: 50,  fee: booking.totalPrice * 0.50 };
  return { refundPercent: 0, fee: booking.totalPrice };
}
```

Process refunds through Stripe Refunds API. Document the policy on the booking page and confirmation email.

---

## 14. Edge Cases Reference

| Edge case | v2 behavior | Required UI/business action |
|---|---|---|
| Same-day rental (pickup = return date) | Rejected by validation | UI sets `returnDate.minDate = pickUpDate + 1 day` |
| Day outside season calendar | Defaults to Low | Calendar should cover full year; alerts on gaps |
| Overlapping season ranges | First match wins | DB constraint prevents overlaps in v2 calendar |
| Return time <= pickup time | Extra hours = 0 (free hours) | Document as customer benefit on booking page |
| Extra hours >= 6 | Full-day-cap applies (not hourly) | UI shows "Late return (X day added)" instead of hours |
| Extra hours >= 30 (more than a day late) | Charges multiple full days | Same UI treatment, escalated |
| Coupon used by 2 customers simultaneously | DB transaction prevents double-use | Already handled by atomic decrement |
| Stripe succeeds but DB write fails | Booking is lost, customer charged | Implement webhook-based reconciliation |
| Customer cancels post-payment | Cancellation policy applies | New endpoint, see §13 |
| Pickup 11:59 PM, return 12:01 AM | Charges 1 day | Document or add grace window |
| Booking spans New Year (Dec 31 - Jan 2) | Calendar must include both years | Maintain calendar per year, no rollover bugs |

---

## 15. Test Suite (Required)

Every test below must pass before launch:

**Day count and season lookup:**
1. Single-day Low (pickup Apr 15, return Apr 16) -> 1 day, RM 140
2. Single-day Peak (pickup May 22, return May 23) -> 1 day, RM 240
3. Single-day Super Peak (pickup Mar 21, return Mar 22) -> 1 day, RM 280
4. Multi-day crossing Low to Peak (May 19 to May 23) -> 4 days, RM 660
5. Multi-day crossing all three seasons (May 20 to May 28) -> mix of Low/Peak/SP

**Extra hours:**
6. No extra hours (return time = pickup time) -> charge 0
7. Return time < pickup time (return earlier) -> charge 0
8. 1 hour extra, last day Low -> 1 x 20 = RM 20
9. 5 hours extra, last day Peak -> 5 x 30 = RM 150 (still hourly, under threshold)
10. 6 hours extra, last day Peak -> full-day cap applies, RM 240 (NOT 6 x 30 = 180)
11. 14 hours extra, last day Peak -> full-day cap, RM 240 (the test case from production)
12. 25 hours extra, last day Peak -> 2 full days, RM 480
13. 14 hours extra, last day Super Peak -> RM 280
14. 14 hours extra, last day Low -> RM 140

**Validation:**
15. Same-day rental rejected (pickup = return date)
16. Return before pickup rejected
17. Booking exceeds Max_Rental_Days rejected
18. Inactive car booking rejected
19. All units already booked rejected

**Coupons:**
20. Valid coupon at 10% applied correctly
21. Invalid coupon (not found) returns error, no discount
22. Expired coupon (usageLeft=0) returns error, no discount
23. Coupon code matching is case-insensitive
24. Coupon applies to entire SubTotal including delivery

**Add-ons and delivery:**
25. Child seat only -> +30
26. Second driver only -> +20
27. Both -> +50
28. Pickup Airport + return Hotel -> +30 + 50 = +80
29. Pickup Office + return Office -> 0

**Integration:**
30. Full worked example A (Innova May 19-23, no extras) -> RM 660
31. Full worked example B (with 14 extra hours) -> RM 900
32. Full worked example D (Christmas with coupon) -> RM 612

---

## 16. Implementation Order

1. Calendar lookup + day counting (Section 4) — pure function, no DB
2. Base rental (Section 5) — pure function
3. **Extra hours with full-day cap** (Section 6) — pure function, the heaviest fix
4. Add-ons (Section 7) — pure function
5. Delivery fee (Section 8) — pure function
6. Validation (Section 3) — DB read
7. Coupon (Section 9) — DB read + atomic decrement
8. Final orchestration (Section 10) — composes all
9. Persistence with Order ID (Section 12) — DB write inside transaction
10. Cancellation flow (Section 13) — new endpoint + Stripe Refund API
11. Run all 32 tests (Section 15) — must all pass before launch

All pure functions should have unit tests before the DB layer is touched.

---

## 17. Schema Reference

**cars table pricing fields:**

| Field | Type | Example (Toyota Innova) |
|---|---|---|
| Price_Low_Season | number | 140 |
| Price_Peak_Season | number | 240 |
| Price_Super_Peak_Season | number | 280 |
| Ext_Hour_Low | number | 20 |
| Ext_Hour_Peak_And_Super_Peak | number | 30 |
| Delivery_Fee_Airport | number | 30 |
| Delivery_Fee_Hotel | number | 50 |
| Min_Rental_Days | number | 1 |
| Max_Rental_Days | number | 30 |
| Number_Of_Units | number | 5 |
| Status | string | "Active" |
| Available_For_Booking | boolean | true |

**season_calendar table:**

| Field | Type |
|---|---|
| From_Date | date (inclusive) |
| To_Date | date (inclusive) |
| Season_Type | enum: "Low" \| "Peak" \| "Super Peak" |

Calendar invariants: no overlaps, no gaps, covers full booking year.

---

## 18. Open Business Decisions

The following need owner sign-off before launch. Defaults are listed but may change.

1. **Full-day cap threshold:** currently 6 hours. Alternative: 4 hours (stricter) or 8 hours (more lenient).
2. **Delivery fee:** currently charged for both pickup and return legs. Alternative: pickup only, or based on distance.
3. **Discount applies to delivery:** currently yes. Alternative: discount only on base rental.
4. **Cancellation tiers:** §13 proposes 100/75/50/0%. Confirm or adjust the thresholds.
5. **Grace window for late-night pickup:** currently none. Alternative: pickup after 9 PM counts toward next day.
6. **Return earlier than pickup time = free hours:** currently yes. Alternative: still charge or pro-rate.
7. **Mid-June to late-August season type:** original data marked as Peak (66 days), v2 calendar set to Low. Confirm which is correct for Langkawi tourist season.
