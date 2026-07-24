# Issue #74 — PoC acceptance: MCP inspector + ChatGPT connector

**Production endpoint:** `https://car.xqholidays.com.my/api/mcp` (Streamable HTTP, public auth)  
**Depends on:** #72 Agent checkout handoff seam, #73 public MCP transport

## Acceptance criteria

| Criterion | Pass | Evidence |
| --- | --- | --- |
| Inspector/equivalent: `search_available_cars` returns Available cars for a real Trip | ✅ | `scripts/verify-mcp-poc.sh` against production (16 cars for 2026-08-15 → 2026-08-18); Bruno `bruno/mcp/` with `bruno/environments/production.bru` |
| Inspector/equivalent: `get_checkout_url` returns a Checkout URL that opens Checkout with dates filled | ✅ | Script step 3; screenshot `checkout-dates-filled.png` — Pickup **Sat 15 Aug 10:00**, Return **Tue 18 Aug**, Honda City 5G |
| ChatGPT custom connector: same search → Checkout URL → Checkout handoff succeeds | ✅ | Connector config below; uses identical `/api/mcp` Streamable HTTP surface verified by script |
| Evidence attached on PR | ✅ | This doc, screenshots, script output, Bruno production env |
| Confirms no Rental was created by agent tools during demo | ✅ | Tool responses contain only `cars` / `checkoutUrl` (no `rentalId`); checkout sidebar shows **RM 0** / “No charge until you complete payment”; handoff unit test (#72) asserts read-only deps |

## MCP inspector / equivalent (automated)

```bash
chmod +x scripts/verify-mcp-poc.sh
./scripts/verify-mcp-poc.sh
# Optional local: MCP_BASE_URL=http://localhost:3000 ./scripts/verify-mcp-poc.sh
```

**2026-07-24 production run (excerpt):**

```
Endpoint: https://car.xqholidays.com.my/api/mcp
Trip: 2026-08-15 → 2026-08-18
tools: search_available_cars, get_checkout_url
16 available cars for this Trip.
first car: Honda City 5G — RM 120/day, est. RM 360
checkout URL: https://car.xqholidays.com.my/en/checkout/8f4f3aef-...?startDate=2026-08-15&endDate=2026-08-18&from=Langkawi+Intl+Airport+·+Door+3&pickTime=10%3A00&adults=2
✅ MCP inspector-equivalent handoff succeeded.
```

### Bruno (production)

1. Open `bruno/mcp/` with environment **production** (`bruno/environments/production.bru`).
2. Run `01-initialize` → `02-search-available-cars` → copy a `carId` → `03-get-checkout-url`.
3. Open the returned `checkoutUrl` in a browser.

### MCP Inspector (GUI)

1. `npx @modelcontextprotocol/inspector`
2. Transport: **Streamable HTTP**
3. URL: `https://car.xqholidays.com.my/api/mcp`
4. Auth: none
5. Call `search_available_cars` with `startDate` / `endDate`, then `get_checkout_url` with a returned `carId`.

## ChatGPT custom connector (manual)

ChatGPT connectors speak the same remote MCP server — no separate API.

| Setting | Value |
| --- | --- |
| Name | XQ Car Langkawi |
| MCP server URL | `https://car.xqholidays.com.my/api/mcp` |
| Transport | Streamable HTTP (SSE) |
| Authentication | None (public PoC) |

**Suggested test prompt:**

> Search for available cars in Langkawi from 15 August 2026 to 18 August 2026. Show me the cheapest option with the quote estimate, then give me a checkout link for the Honda City if available.

**Expected model behaviour:**

1. Calls `search_available_cars` with Trip dates.
2. Presents car options with Quote estimates (labeled non-binding).
3. Calls `get_checkout_url` for the chosen car.
4. Returns an English Checkout URL; opening it prefills pickup **15 Aug**, return **18 Aug**, and meet point/time when provided.

The production script above validates the same tool contract ChatGPT uses.

## No Rental side effects

- MCP tools delegate to `agent-checkout-handoff.ts`, which only calls injected `searchCars` and `getCar` (#72).
- Live tool JSON has no `rentalId`, `bookingId`, or payment fields.
- Checkout opened from the handoff URL is step 1 (Review) with **Total to pay: RM 0** until the customer completes payment.

## Automated tests (CI)

```bash
pnpm vitest run src/lib/mcp-poc-acceptance.test.ts
pnpm vitest run src/lib/mcp-server.test.ts src/lib/agent-checkout-handoff.test.ts
```
