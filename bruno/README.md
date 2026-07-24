# XQ Car MCP (Agent checkout handoff PoC)

Bruno requests for the public Streamable HTTP MCP server at `/api/mcp`.

## Tools

- `search_available_cars` — live fleet availability + Quote estimates
- `get_checkout_url` — English Checkout URL with Trip query params

## How to verify

1. Start the app: `pnpm dev`
2. Open Bruno collection `bruno/mcp/`
3. Run `01-initialize`, then `02-search-available-cars`
4. Copy a `carId` from the response into `bruno/environments/local.bru`
5. Run `03-get-checkout-url` and open the returned URL in a browser

Rate limiting: 60 requests/minute per client IP (429 when exceeded).
