# a2b Agent Readiness Layer

Date: 2026-06-20
Company: a2b only
Repository: abdulazizalrayes/a2b-logistics
Primary domain: https://www.a2b.sa
Owner account/email context: info@a2b.sa for company ownership; do not mix with other companies or repositories.

## Purpose

This layer makes a2b easier for search engines, LLMs, answer engines, procurement agents, and future MCP/API/CLI clients to understand and route correctly without changing the visible website.

It is read-only by default. It can prepare project inquiries, but it does not submit forms, send emails, call phone numbers, quote pricing, confirm availability, or create commercial commitments.

## Added Public Data

- `/data/company.json` - canonical public company facts, entity disambiguation, contact, legal identifiers, leadership, sameAs, fit and non-fit audiences.
- `/data/services.json` - B2B logistics services, best-fit use cases, non-fit use cases, and inquiry fields.
- `/data/capabilities.json` - public capabilities and approval boundaries.
- `/data/service-areas.json` - published service areas and logistics nodes without invented coordinates.
- `/data/project-inquiry-schema.json` - JSON Schema for preparing, not submitting, a project inquiry.
- `/data/agent-routing.json` - fit routing for project inquiries, vendors, careers, internships/training, retail/consumer, spam, and unrelated requests.

## Discovery Files

- `/llms.txt` - concise agent brief.
- `/llms-full.txt` - expanded agent brief.
- `/.well-known/agent-card.json` - A2A-style public agent card.
- `/.well-known/api-catalog` - Linkset for discovery.
- `/.well-known/mcp.json` - MCP endpoint discovery.
- `/.well-known/mcp/server-card.json` - public MCP server card.
- `/.well-known/mcp/server-cards.json` - server card index.
- `/.well-known/agent-skills/index.json` - agent skills index.
- `/openapi.json` - OpenAPI documentation for public data and MCP-style calls.
- `/auth.md` - public authorization, onboarding, and approval policy.

## Public Read-Only MCP/API

Endpoint: `/api/mcp`

Supported JSON-RPC-style methods:

- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `resources/read`

Typed tools:

- `get_company_overview`
- `list_services`
- `match_project_scope`
- `prepare_project_inquiry`
- `list_service_areas`
- `read_public_resource`

The endpoint logs privacy-safe operational events to server logs:

- `mcp_tool_call`
- `mcp_resource_read`

It does not store personal information. Inquiry preparation returns a draft and routing decision only.

## Routing Rules

Project inquiry fit:

- B2B logistics
- trucking and road freight
- warehousing
- customs-clearance coordination
- supply-chain logistics
- fleet capacity
- commercial cargo
- factory/procurement logistics
- Saudi Arabia logistics

Separate flows:

- Careers, internships, and training -> `/careers`
- Vendors, subcontractors, and suppliers -> `/vendors`

Non-fit:

- retail shopping
- B2C parcel delivery
- consumer courier
- personal parcel
- home moving
- ride-hailing
- spam
- unrelated requests

## Crawler Guidance

`robots.txt` allows public website, structured data, discovery docs, OpenAPI, and MCP discovery. It blocks private/admin/internal/dashboard/write-style paths.

Content-Signal policy remains:

- `search=yes`
- `ai-input=yes`
- `ai-train=no`

## Analytics And Reporting

Client-side WebMCP calls emit GA4 events where available:

- `mcp_tool_call`
- `mcp_resource_read`
- `inquiry_preparation`

Server-side `/api/mcp` emits privacy-safe logs:

- `mcp_tool_call`
- `mcp_resource_read`

Static files such as `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/.well-known/*`, and `/data/*` should be checked through Vercel request logs, Vercel Web Analytics, CDN logs, or Search Console crawl data.

Suggested checks:

- Vercel logs: filter paths containing `/api/mcp`, `/llms`, `/openapi.json`, `/.well-known`, or `/data/`.
- GA4 events: filter event names `mcp_tool_call`, `mcp_resource_read`, `inquiry_preparation`.
- Search Console: inspect indexing/crawl status for `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/data/company.json`, and core service pages.
- Referral checks: review traffic source/medium and landing pages for AI/referral domains.

## Testing Commands

Local verification:

```sh
npm run verify
```

MCP local tool list after deployment:

```sh
curl -s https://www.a2b.sa/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

MCP local scope match after deployment:

```sh
curl -s https://www.a2b.sa/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"match_project_scope","arguments":{"query":"factory trucking from Riyadh to Dammam"}}}'
```

Public endpoint checks after deployment:

```sh
curl -I https://www.a2b.sa/llms.txt
curl -I https://www.a2b.sa/llms-full.txt
curl -I https://www.a2b.sa/openapi.json
curl -I https://www.a2b.sa/.well-known/mcp.json
curl -I https://www.a2b.sa/data/company.json
```

## What To Copy To Other Companies

Reusable structure:

- `/data/*.json` resource pattern
- `/llms.txt` and `/llms-full.txt`
- `/.well-known/mcp.json`
- `/.well-known/mcp/server-card.json`
- `/.well-known/mcp/server-cards.json`
- `/.well-known/agent-card.json`
- `/.well-known/api-catalog`
- `/openapi.json`
- `/api/mcp`
- `scripts/verify-site.mjs` agent-readiness checks
- `docs/AGENT_READINESS_LAYER.md` format

Must be changed per company:

- company name, domain, emails, phone, legal identifiers, leadership
- verified social links only
- verified service areas only
- services and non-fit routing
- analytics IDs
- Paperclip company prefix and account ownership
- repository and Vercel project

Do not copy a2b credentials, accounts, DNS, analytics, Paperclip tasks, or social accounts into another company.

## Rollback

This layer is non-visual. Rollback is to revert the commit that added these files and deploy the prior commit. No production DNS, email, or visual layout changes are part of this layer.
