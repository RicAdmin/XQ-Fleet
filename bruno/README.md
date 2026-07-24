# XQ Car MCP (Agent checkout handoff PoC)

Bruno requests for the public Streamable HTTP MCP server at `/api/mcp`.

## Tools

- `search_available_cars` — live fleet availability + Quote estimates
- `get_checkout_url` — English Checkout URL with Trip query params

## How to verify

1. Start the app: `pnpm dev` (or use production — see below)
2. Open Bruno collection `bruno/mcp/`
3. Select environment **local** (`bruno/environments/local.bru`) or **production** (`bruno/environments/production.bru`)
4. Run `01-initialize`, then `02-search-available-cars`
5. Copy a `carId` from the response into the environment `carId` variable
6. Run `03-get-checkout-url` and open the returned URL in a browser

**Production acceptance script:** `./scripts/verify-mcp-poc.sh` (hits `https://car.xqholidays.com.my/api/mcp`)

Rate limiting: 60 requests/minute per client IP (429 when exceeded).
