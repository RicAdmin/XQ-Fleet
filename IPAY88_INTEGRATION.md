# iPay88 OPSG Integration

This document describes how iPay88's Online Payment Switching Gateway (OPSG) is integrated into the XQ Cruise landing web app, including the full transaction flow, database models, API routes, security controls, and environment configuration.

---

## 1. Overview

The integration uses iPay88's standard HTTP POST flow. The merchant site posts payment parameters to iPay88, iPay88 processes the transaction, and returns the result via two channels simultaneously:

- **Response URL** — browser-based redirect, used to show the user a success/failure page.
- **Backend URL** — server-to-server POST, used to reliably capture payment status even if the browser tab is closed.

---

## 2. Transaction Flow

```
User clicks "Pay"
      │
      ▼
POST /api/payment/init
  • Upsert PaymentOrder (status: pending)
  • Generate HMACSHA512 request signature
  • Return form_action + form_params
      │
      ▼
Client auto-submits HTML form to iPay88
  https://payment.ipay88.com.my/epayment/entry.asp
      │
      ▼
User completes payment on iPay88 payment page
      │
      ├──[Simultaneously]──────────────────────────────────────────┐
      ▼                                                             ▼
POST /payment/response                                POST /api/payment/callback
  (browser redirect from iPay88)                        (server-to-server)
  • Parse response params                               • Parse response params
  • Verify HMACSHA512 signature                         • Verify HMACSHA512 signature
  • Match amount against PaymentOrder                   • Match amount against PaymentOrder
  • Update PaymentOrder status                          • Update PaymentOrder status (idempotent)
  • Create PaymentLog entry                             • Create PaymentLog entry (idempotent)
  • Call cruise API /payment-confirm or /payment-fail   • Reply RECEIVEOK
  • Redirect browser to /book/confirmation              (no redirect — server-to-server only)
    or /book/failed
```

> **Idempotency**: Both handlers check `order.status` before writing. If the order is already `paid` or `failed`, no duplicate DB writes or cruise API calls are made.

---

## 3. Database Models

### `PaymentOrder` (`payment_order` table)

One record per booking attempt. Created/updated at payment init and updated on response.

| Column | Type | Description |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `booking_reference` | `String` (unique) | iPay88 `RefNo`, also the cruise booking ref |
| `amount` | `Decimal(12,2)` | Total payment amount |
| `currency` | `VarChar(5)` | e.g. `MYR` |
| `status` | `VarChar(20)` | `pending` → `paid` or `failed` |
| `locale` | `VarChar(10)` | Booking locale for redirect after payment |
| `cruise_api_booking_id` | `String?` | ID from the cruise backend API |
| `billing_first_name` | `String?` | Payer first name |
| `billing_last_name` | `String?` | Payer last name |
| `billing_email` | `String?` | Payer email |
| `billing_phone` | `String?` | Payer phone |
| `billing_address` | `String?` | Payer address |
| `trip_number` | `String?` | Cruise trip reference |
| `prod_desc` | `String?` | iPay88 `ProdDesc` value |
| `cruise_experience` | `String?` | Experience name |
| `departure_date` | `String?` | Departure date string |
| `departure_time` | `String?` | Departure time string |
| `boarding_location` | `String?` | Boarding port/location |
| `adult_count` | `Int?` | Number of adult passengers |
| `children_count` | `Int?` | Number of child passengers |
| `package_inclusions` | `String?` | Included package items |
| `addons_amount` | `Decimal(12,2)?` | Total add-ons amount |
| `is_terms_agreed` | `Boolean?` | Whether T&Cs were accepted |
| `created_at` | `DateTime` | Auto-set on create |
| `updated_at` | `DateTime` | Auto-updated |

### `PaymentLog` (`payment_log` table)

One record per payment event (response or callback). Stores the full raw iPay88 response for audit purposes.

| Column | Type | Description |
|---|---|---|
| `id` | `String` (cuid) | Primary key |
| `payment_order_id` | `String` | FK → `PaymentOrder.id` (cascade delete) |
| `source` | `VarChar(20)` | `response` (browser) or `callback` (backend) |
| `ipay88_trans_id` | `String?` | iPay88 `TransId` |
| `ipay88_auth_code` | `String?` | Bank `AuthCode` |
| `raw_response` | `Json?` | Full iPay88 response params |
| `verified` | `Boolean` | `true` if HMAC signature passed |
| `created_at` | `DateTime` | Auto-set on create |

---

## 4. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MERCHANT_CODE` | Yes | iPay88 merchant code (e.g. `M00XXX`) |
| `MERCHANT_KEY` | Yes | iPay88 merchant key (secret, used for HMAC) |
| `SITE_URL` | Yes | Public base URL of this app (e.g. `https://yoursite.com`). Must be registered with iPay88. **Localhost is not allowed.** |
| `PAYMENT_CALLBACK_SECRET` | Yes | Shared secret between this app and the cruise API for the payment-confirm webhook |
| `VITE_API_BASE_URL` or `API_BASE_URL` | Yes | Base URL of the cruise backend API |
| `VITE_BOOKING_UPDATE_BASE_URL` | No | Base URL for the booking-update link in confirmation emails |

> For local development, use [ngrok](https://ngrok.com): `npx ngrok http 3000` and set `SITE_URL` to the ngrok HTTPS URL. Register the ngrok URL as your Request URL with iPay88 support.

---

## 5. API Routes

### `POST /api/payment/init`

Called by the client before redirecting to iPay88. Creates or updates the `PaymentOrder` and returns the signed form parameters.

**Request body (JSON):**

```ts
{
  booking_reference: string       // Unique ref, used as iPay88 RefNo
  amount: number                  // e.g. 1278.99
  currency: string                // "MYR"
  user_name: string               // Customer name
  user_email: string              // Customer email
  user_contact: string            // Customer phone
  prod_desc: string               // Product description (max 100 chars)
  locale?: string                 // "en" | "zh" etc.
  cruise_api_booking_id?: string
  billing_first_name?: string
  billing_last_name?: string
  billing_email?: string
  billing_phone?: string
  billing_address?: string
  trip_number?: string
  cruise_experience?: string
  departure_date?: string
  departure_time?: string
  boarding_location?: string
  adult_count?: number
  children_count?: number
  package_inclusions?: string
  addons_amount?: number
  is_terms_agreed?: boolean
}
```

**Response (JSON):**

```ts
{
  form_action: "https://payment.ipay88.com.my/epayment/entry.asp"
  form_params: {
    MerchantCode: string
    RefNo: string
    Amount: string           // e.g. "1278.99"
    Currency: string
    ProdDesc: string
    UserName: string
    UserEmail: string
    UserContact: string
    Remark: ""
    Lang: "UTF-8"
    SignatureType: "HMACSHA512"
    Signature: string        // HMACSHA512 hex
    ResponseURL: string      // {SITE_URL}/payment/response
    BackendURL: string       // {SITE_URL}/api/payment/callback
  }
}
```

The client should auto-submit a hidden HTML form to `form_action` with `form_params` as hidden fields.

---

### `POST /payment/response`

Receives the browser-based redirect from iPay88 after payment.

- Parses `application/x-www-form-urlencoded` POST body from iPay88.
- Verifies signature, amount, and order existence.
- Writes `PaymentOrder` status + `PaymentLog`.
- Calls cruise API to confirm or fail the booking.
- Triggers confirmation email.
- Redirects browser to `/{locale}/book/confirmation?ref=...&token=...` on success, or `/{locale}/book/failed?ref=...` on failure.

---

### `POST /api/payment/callback`

Server-to-server backend post from iPay88. Only fires on payment **success**.

- Same verification logic as `/payment/response`.
- Idempotent: skips if order is already `paid`.
- Must respond with the plain text `RECEIVEOK` (no HTML) to acknowledge receipt.
- iPay88 retries up to 3 times if `RECEIVEOK` is not received.

---

## 6. Security Controls

### 6.1 Request Signature (sent to iPay88)

Generated in `src/lib/ipay88.ts → generateRequestSignature`.

**Algorithm:** HMAC-SHA512  
**Key:** `MERCHANT_KEY`  
**Input string:** `MerchantKey + MerchantCode + RefNo + Amount + Currency + Xfield1`

Amount normalisation: remove all `.` and `,` before hashing.  
Example: `"1,278.99"` → `"127899"`

```ts
// Amount: "1.00" → "100"
// String: apple + M00003 + A00000001 + 100 + MYR + ""
// Key: apple
// → HMACSHA512 hex
```

### 6.2 Response Signature Verification (received from iPay88)

Verified in `src/lib/ipay88.ts → verifyResponseSignature`.

**Algorithm:** HMAC-SHA512  
**Key:** `MERCHANT_KEY`  
**Input string:** `MerchantKey + MerchantCode + PaymentId + RefNo + Amount + Currency + Status`

The computed signature must exactly match the `Signature` field from iPay88's response. If it doesn't, the response is rejected and logged.

### 6.3 Amount Verification

After signature verification, the received `Amount` is compared to the stored `PaymentOrder.amount`. A mismatch of more than `0.01` is rejected as `amount_mismatch`.

### 6.4 Cruise API Webhook Signature

When calling the cruise backend `/api/public/payment-confirm` or `/api/public/payment-fail`, a separate HMAC-SHA256 signature is computed:

```
HMAC-SHA256(key: PAYMENT_CALLBACK_SECRET, data: RefNo + PAYMENT_CALLBACK_SECRET)
```

This prevents unauthorised parties from triggering payment confirmation on the cruise API.

### 6.5 Duplicate Processing Guard

Both response and callback handlers check `order.status` before writing. A `paid` order on the success path (or `failed` order on the failure path) returns `alreadyProcessed: true` without re-triggering the cruise API or email.

---

## 7. Re-query Payment Status

If neither response nor callback was received (e.g. browser closed mid-payment), use iPay88's re-query endpoint to check status manually.

**URL:** `https://payment.ipay88.com.my/epayment/enquiry.asp`

**GET parameters:**

| Param | Description |
|---|---|
| `MerchantCode` | Your merchant code |
| `RefNo` | The booking reference |
| `Amount` | Amount with two decimals |

**Possible replies:**

| Reply | Meaning |
|---|---|
| `00` | Successful payment |
| `Record not found` | Transaction does not exist |
| `Incorrect amount` | Amount mismatch |
| `Payment fail` | Payment failed |
| `Invalid parameters` | Bad request params |

For programmatic requery with full card details, use the SOAP webservice at:  
`https://payment.ipay88.com.my/epayment/webservice/TxInquiryCardDetails/TxDetailsInquiry.asmx`

---

## 8. Payment Status Values

| Status | Meaning |
|---|---|
| `pending` | `PaymentOrder` created, user has not completed payment |
| `paid` | iPay88 returned Status=1, signature verified, cruise API confirmed |
| `failed` | iPay88 returned Status=0, order marked failed |

iPay88 webservice requery also returns:

| Status | Meaning |
|---|---|
| `1` | Success |
| `0` | Fail |
| `6` | Payment pending |
| `20` | Authorised |

---

## 9. Key Source Files

| File | Purpose |
|---|---|
| `src/lib/ipay88.ts` | HMAC signature generation and verification |
| `src/lib/payment-response.ts` | Parse iPay88 form POST, resolve locale, build redirect paths |
| `src/lib/payment-verify.ts` | Core payment processing: verify, update DB, call cruise API, send email |
| `src/routes/api.payment.init.ts` | `POST /api/payment/init` — create order, generate form params |
| `src/routes/api.payment.callback.ts` | `POST /api/payment/callback` — server-to-server backend post handler |
| `src/routes/payment.response.tsx` | `POST /payment/response` — browser redirect handler |
| `prisma/schema.prisma` | `PaymentOrder` and `PaymentLog` Prisma models |

---

## 10. Testing Checklist

- [ ] Set `SITE_URL` to an ngrok HTTPS URL (not localhost).
- [ ] Register the ngrok URL as Request URL with iPay88 support.
- [ ] Whitelist your server IP with iPay88 for Response URL and Backend URL.
- [ ] Use amount `MYR 1.00` for test transactions.
- [ ] Verify `PaymentOrder` row created with `status: pending` after init.
- [ ] Verify `PaymentOrder` updated to `paid` and `PaymentLog` row created after successful payment.
- [ ] Verify cruise API `/api/public/payment-confirm` is called and returns 200.
- [ ] Verify confirmation email is sent.
- [ ] Test failure path: verify `status: failed` and failure email sent.
- [ ] Test duplicate callback: confirm second callback does not re-trigger cruise API.
- [ ] Validate signature mismatch is caught and logged.
- [ ] Test re-query for a completed transaction.

---

## 11. Common Errors

| Error | Cause | Fix |
|---|---|---|
| `Duplicate reference number` | `RefNo` reused after a successful payment | Generate a new unique booking reference |
| `Invalid merchant code` | Wrong `MERCHANT_CODE` env var | Check with iPay88 support |
| `Permission not allow` | Request URL not registered with iPay88 | Register the exact domain/IP with iPay88 support |
| `Signature not match` | Wrong `MERCHANT_KEY` or incorrect hash string | Double-check key and amount normalisation |
| `RECEIVEOK` not received | Backend URL returned HTML or error | Ensure `/api/payment/callback` returns plain `RECEIVEOK` with no HTML |
| `cruise_api_failed` | Cruise API `/payment-confirm` returned non-200 | Check `PAYMENT_CALLBACK_SECRET` matches on both sides and API is reachable |
