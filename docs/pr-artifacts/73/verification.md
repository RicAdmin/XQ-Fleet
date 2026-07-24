# Issue #73 — Public MCP at /api/mcp verification

**Transport:** `src/routes/api/mcp.ts` → `src/lib/mcp-route.ts` → `src/lib/mcp-server.ts`  
**Handoff seam:** `src/lib/agent-checkout-handoff.ts` (see #72)

## Acceptance criteria

| Criterion | Pass | Evidence |
| --- | --- | --- |
| `/api/mcp` serves Streamable HTTP MCP and lists both tools | ✅ | `mcp-server.test.ts` — "lists search_available_cars and get_checkout_url tools" |
| Tool calls invoke the Agent checkout handoff seam | ✅ | `mcp-server.test.ts` — search + checkout URL tool call cases |
| No OAuth or API key required for this PoC | ✅ | Route has no auth middleware; Bruno requests use `auth: none` |
| IP rate limiting fails closed with a clear error when over quota | ✅ | `mcp-rate-limit.test.ts`, `mcp-route.test.ts` — route returns HTTP 429 JSON |
| MCP discovery / server card advertises public auth (not OAuth) | ✅ | `agent-discovery.test.ts` — MCP server card `authentication.type: public`; static `public/.well-known/mcp/server-card.json` |
| Verifiable with MCP inspector (or equivalent HTTP MCP client) | ✅ | Bruno collection `bruno/mcp/`; manual steps below |
| `@tanstack/ai-mcp` is not introduced for this work | ✅ | `package.json` uses `@modelcontextprotocol/sdk` only |

## How to verify

### Automated

```bash
pnpm vitest run src/lib/mcp-server.test.ts src/lib/mcp-route.test.ts src/lib/mcp-rate-limit.test.ts src/lib/agent-discovery.test.ts
```

### MCP inspector / Bruno (local)

1. `pnpm dev`
2. Run `bruno/mcp/01-initialize.bru`, then `02-search-available-cars.bru`, then `03-get-checkout-url.bru` against `http://localhost:3000`.
3. Or point MCP Inspector at `http://localhost:3000/api/mcp` (Streamable HTTP, no auth).

### Discovery

```bash
curl -s http://localhost:3000/.well-known/mcp/server-card.json | jq .authentication
# → { "type": "public" }
```
