# AI And Agent Analytics Reporting

Date: 2026-06-29
Company: a2b only

## Purpose

Track whether search engines, LLM crawlers, procurement agents, and AI assistants are reading a2b's public machine-readable resources and using the public MCP endpoint.

## Event Catalog

Source file: `/data/analytics-events.json`

Core events:

- `contact_click`
- `form_submit_attempt`
- `mcp_tool_call`
- `mcp_resource_read`
- `inquiry_preparation`
- `public_discovery_read`

## Privacy Rules

- Do not log personal inquiry content.
- Do not log full form payloads.
- Do not expose private account data.
- Use aggregate path, event, route, user-agent family, and referrer reporting.

## GA4 Checks

In GA4, review:

- event name contains `mcp_`
- event name is `inquiry_preparation`
- traffic source / medium with AI or referral-like sources
- landing pages containing `/llms`, `/openapi.json`, `/data/`, `/.well-known/`, `/api/mcp`

## Vercel / CDN Log Checks

Filter request paths:

```text
/api/mcp
/llms.txt
/llms-full.txt
/openapi.json
/.well-known/
/data/
```

Useful dimensions:

- path
- method
- status code
- user-agent
- referrer
- country
- timestamp

## Local Report Template

Generate a blank report:

```sh
node scripts/agent-analytics-report.mjs
```

The generated report is a template for manual GA4/Vercel/Search Console observations.

## Paperclip Recording

Record monthly results in Paperclip under a2b only:

- findings
- traffic/crawler evidence
- errors or blocked crawlers
- suggested non-visual improvements
- owner decisions needed
