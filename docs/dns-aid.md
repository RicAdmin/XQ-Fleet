# DNS for AI Discovery (DNS-AID)

Publish DNS-AID records so agents can discover XQCar endpoints via DNS
([draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/),
[RFC 9460](https://www.rfc-editor.org/rfc/rfc9460)).

## Zone

- Apex DNS: `xqholidays.com.my` (Cloudflare)
- Site host: `car.xqholidays.com.my` → `xqcar.netlify.app`

Records below are relative to `xqholidays.com.my`.

## Required records

### Organizational index

```dns
_index._agents.car.xqholidays.com.my. 3600 IN HTTPS 1 car.xqholidays.com.my. (
  alpn="h2,h3"
  port=443
)
```

Cloudflare dashboard equivalent:

| Type  | Name                         | Priority | Target                  | Value                                      |
|-------|------------------------------|----------|-------------------------|--------------------------------------------|
| HTTPS | `_index._agents.car`         | 1        | `car.xqholidays.com.my` | `alpn="h2,h3" port=443`                    |

### MCP agent leaf (optional but recommended)

```dns
xqcar._agents.car.xqholidays.com.my. 3600 IN HTTPS 1 car.xqholidays.com.my. (
  alpn="h2,h3"
  port=443
)
```

After `/.well-known` HTTP discovery is live, agents can follow:

- MCP card: `https://car.xqholidays.com.my/.well-known/mcp/server-card.json`
- Skills index: `https://car.xqholidays.com.my/.well-known/agent-skills/index.json`
- API catalog: `https://car.xqholidays.com.my/.well-known/api-catalog`

## DNSSEC

Enable DNSSEC on the Cloudflare zone `xqholidays.com.my` (DNS → DNSSEC → Enable)
so validating resolvers return authenticated DNS-AID data.

## Validation

```bash
# DoH (Cloudflare)
curl -sH 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.car.xqholidays.com.my&type=HTTPS'

# Scanner
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d '{"url":"https://car.xqholidays.com.my"}' \
  | jq '.checks.discoverability.dnsAid'
```

Expect `checks.discoverability.dnsAid.status` → `"pass"`.

## Notes

- Experimental DNS-AID SvcParamKeys (e.g. draft `well-known=`) may need numeric
  `keyNNNNN=` form until IANA registration; HTTPS/`alpn`/`port` alone is enough
  for the current isitagentready DNS-AID entrypoint check.
- No Cloudflare API token is stored in this repo — apply the records in the
  Cloudflare dashboard (or via API with a local token).
