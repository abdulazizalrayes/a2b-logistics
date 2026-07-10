# DNS-AID Blocker

Date: 2026-06-18
Company: a2b only

## Finding

IsItAgentReady reports a2b as Level 5 Agent-Native, but the DNS-AID check does not fully pass because authoritative DNS does not publish valid `SVCB` or `HTTPS` discovery records.

The valid TXT index records are already present:

- `_index._agents.a2b.sa`
- `_index._agents.www.a2b.sa`

Both use:

```text
agents=a2b-logistics:webmcp,a2b-a2a:a2a,a2b-mcp:mcp
```

## Blocker

DNET's DNS editor exposes `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, and `SRV`. It does not expose `SVCB` or `HTTPS` record types.

## 2026-06-20 Recheck

- TXT records still resolve for `_index._agents.a2b.sa` and `_index._agents.www.a2b.sa`.
- `SVCB` and `HTTPS` queries for the DNS-AID agent service names still return no records.
- Initial DNET access was stopped at login/reCAPTCHA; after owner login, the DNS editor was audited and confirmed not to expose `SVCB` or `HTTPS`.

## 2026-06-20 DNET Ticket

- Confirmed DNET account context: Abdulaziz Khalid Alrayes, customer `#24411935833`.
- Confirmed DNET DNS management context: `a2b.sa`.
- Confirmed DNET DNS editor only exposes `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, and `SRV`.
- Created DNET support ticket `44115` at `2026-06-20 11:53:10` with title `a2b.sa DNS-AID SVCB/HTTPS records request`.
- Requested manual addition of the required DNS-AID `SVCB` records, or equivalent `HTTPS` type 65 records, without changing nameservers, MX, A, CNAME, or existing website/email routing.

## 2026-07-10 IsItAgentReady Recheck

- IsItAgentReady URL checked: `https://isitagentready.com/www.a2b.sa`.
- Overall score: `93`, Level 5 `Agent-Native`.
- Passing categories:
  - Discoverability: `3/4`
  - Content: `1/1`
  - Bot Access Control: `3/3`
  - API, Auth, MCP & Skill Discovery: `7/7`
- The only failed check is `DNS for AI Discovery (DNS-AID)`.
- Checker issue text: DNS-AID TXT index found, but no valid `SVCB` / `HTTPS` discovery records were found.
- Direct DNS verification:
  - `TXT _index._agents.a2b.sa` resolves.
  - `TXT _index._agents.www.a2b.sa` resolves.
  - `SVCB`, `HTTPS`, and `TYPE65` queries for `a2b-logistics._webmcp._agents.www.a2b.sa` return no records.
  - Authoritative nameservers remain DNET: `ns1.dnetns.com`, `ns2.dnetns.com`, `ns3.dnetns.com`.

## Required DNS-AID Records

Preferred record type: `SVCB`.

```dns
a2b-logistics._webmcp._agents.www.a2b.sa. 3600 IN SVCB 1 www.a2b.sa. alpn="h2" port=443 mandatory="alpn,port"
a2b-a2a._a2a._agents.www.a2b.sa. 3600 IN SVCB 1 www.a2b.sa. alpn="a2a" port=443 mandatory="alpn,port"
a2b-mcp._mcp._agents.www.a2b.sa. 3600 IN SVCB 1 www.a2b.sa. alpn="mcp" port=443 mandatory="alpn,port"
a2b-logistics._webmcp._agents.a2b.sa. 3600 IN SVCB 1 www.a2b.sa. alpn="h2" port=443 mandatory="alpn,port"
a2b-a2a._a2a._agents.a2b.sa. 3600 IN SVCB 1 www.a2b.sa. alpn="a2a" port=443 mandatory="alpn,port"
a2b-mcp._mcp._agents.a2b.sa. 3600 IN SVCB 1 www.a2b.sa. alpn="mcp" port=443 mandatory="alpn,port"
```

If the DNS provider only exposes the HTTPS/SVCB numeric type as `TYPE65`, request equivalent type-65 records with the same owner names, priority `1`, target `www.a2b.sa.`, and parameters `alpn`, `port=443`, and `mandatory=alpn,port`.

## Fix Paths

1. Ask DNET support to add the required `SVCB` or `HTTPS` DNS-AID records manually.
2. If DNET cannot support those record types, approve a production DNS migration to a provider that supports `SVCB` and `HTTPS` records.

## Approval Requirement

Do not change nameservers or move authoritative DNS without explicit owner approval. This is a production DNS decision.

## Rollback

No website or email routing depends on the DNS-AID TXT index. If needed, rollback is to remove the two `_index._agents` TXT records.
