# auth.md

Agent authentication and registration for **XQCar** (Langkawi car rental).

## Audience

This document is for AI agents and automated clients that need to discover how to authenticate with XQCar customer and staff APIs.

## Resource server

- **Resource identifier:** `https://carxq.com/`
- **Protected resource metadata:** [/.well-known/oauth-protected-resource](https://carxq.com/.well-known/oauth-protected-resource)

## Authorization server

- **Issuer:** `https://carxq.com/api/auth`
- **OAuth metadata:** [/.well-known/oauth-authorization-server](https://carxq.com/.well-known/oauth-authorization-server)
- **OpenID Connect:** [/.well-known/openid-configuration](https://carxq.com/.well-known/openid-configuration)
- **Registration:** `https://carxq.com/auth.md` (this document)

## Registration

XQCar uses session-based authentication for the public booking site. Agents should:

1. Read [llms.txt](https://carxq.com/llms.txt) for site structure and booking flows.
2. Use [/.well-known/api-catalog](https://carxq.com/.well-known/api-catalog) for machine-readable API discovery.
3. For customer accounts, direct users to [login](https://carxq.com/login) or [register](https://carxq.com/register) — agents must not create accounts without explicit user consent.
4. For programmatic access requests, contact **hello@carxq.my** with use case, expected volume, and OAuth client details.

## Supported identity types

| Type | Method | Notes |
|------|--------|-------|
| Anonymous | Session cookie | Browse fleet and public content only |
| Verified email | Email/password or Google OAuth | Required for bookings and account management |

## Scopes

- `openid` — OpenID Connect identity
- `profile` — Name and profile fields
- `email` — Email address
- `offline_access` — Refresh token (when OAuth client access is provisioned)

## Bearer methods

- `Authorization: Bearer <token>` (when API tokens are provisioned)
- Session cookies for browser-based flows via `/api/auth`

## Revocation

Session revocation: `POST https://carxq.com/api/auth/sign-out`

For API token revocation, contact hello@carxq.my.

## Related discovery

- [MCP server card](https://carxq.com/.well-known/mcp/server-card.json)
- [Agent skills index](https://carxq.com/.well-known/agent-skills/index.json)
- [Privacy policy](https://carxq.com/privacy)
