# Conversion event contract (GA4)

Stable measurement names and fire points for organic → checkout → paid booking. Prefer these names in GA4 explorations and downstream SEO packages (#45 / I1).

## Client events (gtag)

| Event | When | Params (no PII) | Code |
| --- | --- | --- | --- |
| `page_view` | Public client navigations (not `/admin`, `/app`, `/internal`) | `page_path`, `page_location`, `page_title` | `trackPageView` via `GaPageViews` |
| `begin_checkout` | Valid public checkout session mounts (car resolved + trip dates complete) | `currency` (`MYR`), `item_id` (car id), optional `value` | `trackBeginCheckout` in `/$locale/checkout/$carId` |
| `purchase` | Paid booking confirmation UI after iPay88 return (`?payment=response` and customer status Confirmed) | `transaction_id` (rental UUID), `value` (MYR major units from `paidAmountSen` — deposit or full charge collected at gateway success), `currency` (`MYR`) | `trackPurchase` in `/$locale/checkout/confirmed/$rentalId` and `/account/bookings/$rentalId` |

Helpers live in [`src/lib/ga.ts`](../src/lib/ga.ts). Guards: missing `window.gtag`, missing/invalid `VITE_GA_MEASUREMENT_ID`, or excluded staff paths → no-op. Purchases are deduped per `transaction_id` in the browser session.

## Durable server paid signal

Client `purchase` is the analytics conversion; the durable booking record remains the rental row after iPay88 success:

- Webhook / response processing: [`src/lib/ipay88-process-payment.ts`](../src/lib/ipay88-process-payment.ts) sets `rentals.paymentStatus = 'paid'` and `paidAmountSen` when the gateway reports success.
- Entry points: `POST /api/webhooks/ipay88` and `POST /api/payment/response`.
- Guest return URL: `/$locale/checkout/confirmed/$rentalId?payment=response`.
- Logged-in return URL: `/account/bookings/$rentalId?payment=response`.

Join analytics `transaction_id` to `rentals.id` (and thus `paymentStatus` / payments rows). Do not send email, phone, or other customer PII on these events.

## Privacy

Same surface as existing GA4 page views and PDPA/privacy analytics disclosure. No consent banner and no additional third-party SDKs were introduced for this contract.
