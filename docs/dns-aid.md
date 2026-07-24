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

| Type  | Name                 | Priority | Target                  | Value                   |
| ----- | -------------------- | -------- | ----------------------- | ----------------------- |
| HTTPS | `_index._agents.car` | 1        | `car.xqholidays.com.my` | `alpn="h2,h3" port=443` |

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

DNSSEC needs an authenticated chain from the `.com.my` parent to Cloudflare. Zone
signing alone is not enough: Cloudflare can return `RRSIG` records while validating
resolvers still return `AD=false` if the parent has no `DS` record.

1. In Cloudflare, open `xqholidays.com.my` → **DNS** → **Settings** and enable
   DNSSEC.
2. Open **DS Record** and copy the generated key tag, algorithm, digest type, and
   digest. Do not copy a DS value from this document because Cloudflare can rotate
   the key.
3. In Exabytes MyPanel, open the `xqholidays.com.my` domain → **DNSSEC/DS
   Records** → **Add DS Record**, enter the Cloudflare values, and save.
4. Wait for Exabytes/MYNIC to publish the DS record in the `.com.my` parent. The
   Cloudflare status remains **Pending** until that happens.
5. Confirm Cloudflare shows DNSSEC as **Active** and both public-resolver checks
   below return authenticated data.

Do not cancel and restart Cloudflare DNSSEC while the matching DS record is pending
at the registrar. That would generate a different key and can leave a stale parent
DS record, which breaks resolution for validating clients.

## Validation

```bash
# DoH (Cloudflare)
curl -sH 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.car.xqholidays.com.my&type=HTTPS'

# Parent delegation must return the Cloudflare DS record.
dig +dnssec xqholidays.com.my DS @1.1.1.1

# HTTPS is RR type 65. TYPE65 works with older dig versions that do not know the
# HTTPS mnemonic. Expect the HTTPS answer, its RRSIG, and `ad` in the header flags.
dig +dnssec _index._agents.car.xqholidays.com.my TYPE65 @1.1.1.1

# Scanner
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d '{"url":"https://car.xqholidays.com.my"}' \
  | jq '.checks.discoverability.dnsAid'
```

Expect `checks.discoverability.dnsAid.status` → `"pass"`.

If the HTTPS answer includes an `RRSIG` but the response header lacks `ad`, query
the parent DS record first. An empty DS answer means registrar/registry publication
is still pending; editing the DNS-AID HTTPS record will not fix that state.

## Notes

- Experimental DNS-AID SvcParamKeys (e.g. draft `well-known=`) may need numeric
  `keyNNNNN=` form until IANA registration; HTTPS/`alpn`/`port` alone is enough
  for the current isitagentready DNS-AID entrypoint check.
- No Cloudflare API token is stored in this repo — apply the records in the
  Cloudflare dashboard (or via API with a local token).
