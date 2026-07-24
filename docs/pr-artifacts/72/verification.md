# Issue #72 — Agent checkout handoff seam verification

**Seam:** `src/lib/agent-checkout-handoff.ts` (`searchAvailableCars`, `getCheckoutUrl`, `buildCheckoutUrl`)

## Acceptance criteria

| Criterion | Pass | Evidence |
| --- | --- | --- |
| `search_available_cars` returns Available cars using shared Trip listing rules | ✅ | Production wiring in `src/lib/mcp-route.ts` injects `listAvailableCarsForTrip` (same helper as `filterPublicCars` on the public site). Unit tests use injected `searchCars`. |
| Each result includes car identity, descriptors, daily rate (MYR), non-binding Quote estimate | ✅ | `agent-checkout-handoff.test.ts` — "returns available cars with quote estimates for a trip" |
| Empty Available-car sets return successfully with a clear message | ✅ | `agent-checkout-handoff.test.ts` — "returns an empty successful search when no cars are available" |
| `get_checkout_url` builds `/en/checkout/{carId}` with required dates; optional Trip fields | ✅ | `agent-checkout-handoff.test.ts` — "builds an English checkout URL with required trip dates" |
| Missing required dates or unknown car id fails clearly | ✅ | `agent-checkout-handoff.test.ts` — date + unknown car error cases |
| Neither operation creates a Rental, payment, or session row | ✅ | Handoff deps are read-only (`searchCars`, `getCar`); `agent-checkout-handoff.test.ts` — "only reads fleet data via injected deps" |
| Automated tests cover handoff seam only (not MCP SDK internals) | ✅ | `src/lib/agent-checkout-handoff.test.ts` (12 tests) |

## How to verify

```bash
pnpm vitest run src/lib/agent-checkout-handoff.test.ts
pnpm vitest run src/lib/available-cars-for-trip.test.ts
```

Shared Trip listing rules live in `src/lib/available-cars-for-trip.ts` (#71). MCP transport (#73) adapts to this seam via `src/lib/mcp-route.ts`.
