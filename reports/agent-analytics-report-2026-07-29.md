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

- GA4 was not opened during this operational follow-up, so no event or referral
  counts are claimed in this report.
- mcp_tool_call: Not measured in this run.
- mcp_resource_read: Not measured in this run.
- inquiry_preparation: Not measured in this run.
- contact_click: Not measured in this run.
- form_submit_attempt: Not measured in this run.
- AI/referral traffic: Not measured in this run.

## Vercel/CDN Observations

- Production deployment: dpl_GcTYQYKyYaVdEUdvv74WpmYYweH7
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

- Search Console was not opened during this operational follow-up.
- No indexing conclusion is claimed from Vercel request logs.

## Findings

- The production Markdown layer remains fully operational across 65 canonical
  routes and 65 direct sidecars.
- HTML bytes: 950467. Markdown bytes: 444449. Reduction: 53.2%.
- No deployment, serverless, or middleware error requiring remediation was
  found.
- Organic AI-agent usage cannot be separated reliably from synthetic validation
  traffic in the current Vercel sample.
- Internal monitoring reports are repository evidence, not public agent
  resources. The Vercel exclusion was broadened to omit the entire reports
  directory; an isolated dry build confirmed both old and new reports are absent
  from deployment output.

## Recommended Improvements

- Keep the validation sweep timestamp in future reports and exclude that window
  from adoption analysis.
- Review GA4 AI referral and custom MCP event data separately when an
  authenticated a2b analytics session is intentionally opened.
- Continue using privacy-safe aggregate counts. Do not log prompt bodies,
  inquiry content, email addresses, or other personal information.
- No paid log drain or managed Markdown provider is justified by current usage.
- Keep reports/ excluded from production and publish only deliberately approved
  public data under /data, /.well-known, llms files, OpenAPI, or MCP.

## Owner Decisions Needed

- None.
