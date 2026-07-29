# a2b AI And Agent Analytics Report

Date: 2026-07-29
Company: a2b only

## Events To Check

- contact_click: Track public contact-link engagement.
- form_submit_attempt: Track form submit attempts by form id.
- mcp_tool_call: Track public MCP tool usage.
- mcp_resource_read: Track public structured resource reads.
- inquiry_preparation: Track read-only inquiry draft preparation.
- public_discovery_read: Track reads of llms, OpenAPI, data, and well-known discovery files via Vercel/CDN logs.

## GA4 Observations

- Authenticated property confirmed: account `a2b Logistics`, property `a2b.sa`,
  account/property IDs `a387477572 / p528263495`.
- Last 7 days: 65 sessions. Channel totals were Direct 39, AI Assistant 11,
  Organic Search 9, Referral 3, and Unassigned 0.
- Last 7 days source/medium: `chatgpt.com / ai-assistant` generated 11 sessions
  and `chatgpt.com / referral` generated 2 sessions. Combined ChatGPT-sourced
  sessions were 13 of 65, or 20.0%.
- Last 28 days, Jul 1-28: 1,685 events from 282 users across 14 event names.
- `contact_click`: 19 events from 13 users.
- `form_submit_attempt`: 8 events from 6 users.
- `mcp_tool_call`, `mcp_resource_read`, and `inquiry_preparation` were absent
  from the 14 recorded GA4 event names.
- Browser-side WebMCP calls emit the custom GA4 events only when `gtag` is
  available. Calls to the public `/api/mcp` endpoint instead emit structured,
  privacy-safe server logs and are not expected to appear in GA4.

## Vercel/CDN Observations

- Production deployment: dpl_7yDLDZUiu8XC81y32KNoMso7YtRu
- Deployment state: Ready, with www.a2b.sa, a2b.sa, and the Vercel production
  aliases attached.
- Recent production error query: No error-level records returned.
- Latest 1,000 production log records: 927 completed HTTP 200 responses, zero
  4xx responses, and zero 5xx responses.
- The remaining records had responseStatusCode 0 on edge middleware invocation
  records. They are not HTTP failures.
- The current sample is dominated by the 65-route production validation sweep.
  It must not be treated as evidence of organic crawler or agent usage.
- /api/mcp: Live initialization passed; 8 tools and 17 resources were listed.
- /llms.txt and /llms-full.txt: Live HTTP 200 with text/plain.
- /openapi.json: Live HTTP 200 with valid JSON.
- /.well-known/ and /data/: Sampled discovery documents returned HTTP 200 and
  parsed as valid JSON.
- The older internal report at
  /reports/agent-analytics-report-2026-06-29.md was publicly reachable because
  the reports directory was not excluded from Vercel output.

## Search Console Observations

- GA4 showed that the verified Search Console property
  `https://www.a2b.sa/` is not linked to the a2b GA4 property.
- No account link was created during this read-only review.
- No indexing conclusion is claimed from GA4 or Vercel request logs.

## Findings

- The production Markdown layer remains fully operational across 65 canonical
  routes and 65 direct sidecars.
- HTML bytes: 950467. Markdown bytes: 444449. Reduction: 53.2%.
- No deployment, serverless, or middleware error requiring remediation was
  found.
- ChatGPT is already a material acquisition source: 13 of 65 sessions in the
  observed seven-day period, including 11 classified in the AI Assistant
  channel.
- GA4 is suitable for AI referral and browser-side WebMCP measurement, but it
  does not measure direct server-to-server MCP calls. Vercel function logs are
  the authoritative source for those calls.
- Organic server-side AI-agent usage cannot be separated reliably from
  synthetic validation traffic in the current Vercel sample.
- Internal monitoring reports are repository evidence, not public agent
  resources. The Vercel exclusion was broadened to omit the entire reports
  directory; an isolated dry build confirmed both old and new reports are absent
  from deployment output.

## Recommended Improvements

- Keep the validation sweep timestamp in future reports and exclude that window
  from adoption analysis.
- Review GA4 AI referrals and Vercel MCP logs as separate datasets. Do not add
  them together as if they measured the same interaction.
- Add a privacy-safe monthly aggregation of Vercel events by event name, tool,
  resource, route, status, and day. Keep request bodies and personal information
  out of logs.
- Link the verified `https://www.a2b.sa/` Search Console property to the a2b
  GA4 property after owner approval so search landing-page performance can be
  reviewed beside AI referrals.
- Continue using privacy-safe aggregate counts. Do not log prompt bodies,
  inquiry content, email addresses, or other personal information.
- No paid log drain or managed Markdown provider is justified by current usage.
- Keep reports/ excluded from production and publish only deliberately approved
  public data under /data, /.well-known, llms files, OpenAPI, or MCP.

## Owner Decisions Needed

- Approve or decline linking the verified a2b Search Console property to GA4.
- Approve implementation of a persistent, privacy-safe server-side MCP aggregate
  only if the existing Vercel log-retention window proves insufficient. This may
  require a new analytics binding or credential and must not be enabled silently.
