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

## Fix Paths

1. Ask DNET support to add the required `SVCB` or `HTTPS` DNS-AID records manually.
2. If DNET cannot support those record types, approve a production DNS migration to a provider that supports `SVCB` and `HTTPS` records.

## Approval Requirement

Do not change nameservers or move authoritative DNS without explicit owner approval. This is a production DNS decision.

## Rollback

No website or email routing depends on the DNS-AID TXT index. If needed, rollback is to remove the two `_index._agents` TXT records.
