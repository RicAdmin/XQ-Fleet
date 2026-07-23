# auth.md

Agent authentication and registration for **XQCar** (Langkawi car rental).

## Audience

This document is for AI agents and automated clients that need to discover how to authenticate with XQCar customer and staff APIs.

## Resource server

- **Resource identifier:** `https://car.xqholidays.com.my/`
- **Protected resource metadata:** [/.well-known/oauth-protected-resource](https://car.xqholidays.com.my/.well-known/oauth-protected-resource)

## Authorization server

- **Issuer:** `https://car.xqholidays.com.my/api/auth`
- **OAuth metadata:** [/.well-known/oauth-authorization-server](https://car.xqholidays.com.my/.well-known/oauth-authorization-server)
- **OpenID Connect:** [/.well-known/openid-configuration](https://car.xqholidays.com.my/.well-known/openid-configuration)
- **Registration:** `https://car.xqholidays.com.my/auth.md` (this document)

## Registration

XQCar uses session-based authentication for the public booking site. Agents should:

1. Read [llms.txt](https://car.xqholidays.com.my/llms.txt) for site structure and booking flows.
2. Use [/.well-known/api-catalog](https://car.xqholidays.com.my/.well-known/api-catalog) for machine-readable API discovery.
3. For customer accounts, direct users to [login](https://car.xqholidays.com.my/login) or [register](https://car.xqholidays.com.my/register) — agents must not create accounts without explicit user consent.
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

Session revocation: `POST https://car.xqholidays.com.my/api/auth/sign-out`

For API token revocation, contact hello@carxq.my.

## Related discovery

- [MCP server card](https://car.xqholidays.com.my/.well-known/mcp/server-card.json)
- [Agent skills index](https://car.xqholidays.com.my/.well-known/agent-skills/index.json)
- [Privacy policy](https://car.xqholidays.com.my/privacy)
