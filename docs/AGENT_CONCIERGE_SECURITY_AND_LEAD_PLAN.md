# a2b Agent Concierge Security And Lead Plan

Date: 31 August 2026
Scope: a2b Logistics only
Status: Agent-only pilot implemented in source

## Executive Recommendation

Proceed with the agent-only concierge as a controlled pilot. The implementation is appropriate for a2b because it helps procurement assistants and external agents understand service fit, collect the inputs needed for an RFQ, and route buyers correctly without adding a visible human chat interface or allowing an automated system to make commercial commitments.

The pilot is intentionally deterministic. It does not call a paid AI model, use a database, browse private systems, send email, submit forms, create bookings, or read environment secrets. This keeps cost and breach impact low while producing evidence about what agents actually ask.

## What It Can Improve

1. Reduce ambiguity for international B2B and B2G buyers evaluating Saudi logistics support.
2. Explain the five published service categories in a structured, citable response.
3. Classify buyer, procurement, vendor, careers, and non-fit requests before they reach the wrong channel.
4. Prepare the buyer to provide origin, destination, cargo, timing, frequency, and handling requirements.
5. Surface published CR, VAT, address, and contact facts without inventing certifications or legal claims.
6. Record new unanswered questions after redaction so the public knowledge base can improve.

This can improve lead quality and reduce friction, but it cannot guarantee leads or revenue. Success should be measured by qualified agent interactions, RFQ preparation intent, repeat questions, and eventual approved contact actions.

## Security Architecture

### Public Endpoint Versus Private Backend

The endpoint must be public so external agents can call it. Public accessibility does not mean private access. The deployed function runs on Vercel, while its source logic and deployment credentials remain outside the browser.

The concierge has no provider API key because it makes no AI model call. It has no database connection, customer-data connector, email connector, CRM connector, filesystem browsing tool, shell tool, or arbitrary URL fetch supplied by a caller. Its only knowledge sources are allowlisted public a2b JSON files checked into the repository.

### Input Controls

- POST and OPTIONS only
- JSON content type only
- 32 KB maximum body
- 2,000-character maximum question
- English agent response during the pilot
- Strict allowlist of request fields
- Personal email and phone patterns rejected
- Password, token, API-key, private-key, and secret patterns rejected
- Prompt-injection and arbitrary-command instructions rejected
- Canonical production host required
- No source IP written to application logs

### Abuse Controls

- Five concierge requests per minute per transient application instance and client key
- Sixty MCP requests per minute per transient application instance and client key
- Duplicate-question suppression
- Temporary local block after repeated malformed or prompt-injection requests
- `429` response with `Retry-After`
- Planned Cloudflare free-plan path-level rate rule for `/api/agent-concierge` and `/api/mcp`, pending a2b WAF-management permission

Cloudflare documents that its Free plan supports one rate-limiting rule, a path-based expression, IP counting, a 10-second counting period, and a 10-second mitigation period. The planned rule must avoid challenges because legitimate agents may not execute JavaScript. The recommended edge action is a normal block with a JSON-safe `429` response where the plan permits it. The current signed-in a2b account can see the zone but is denied WAF management, so this layer must not be marked active until the owner role applies and verifies it. Source: https://developers.cloudflare.com/waf/rate-limiting-rules/

### Logging And Question Review

Answered question content is not logged. The server logs the event type, request ID, normalized fingerprint, intent, fit, answer status, duplicate status, review flag, and timestamp.

A new unanswered question is logged once after redaction. Email addresses, phone numbers, credential-like values, tokens, private keys, and control characters are removed. The report command is:

```bash
npm run agent:concierge:report -- <vercel-json-log-file>
```

Only verified public facts may be added as future answers.

## SEO, AEO, And GEO Impact

The pilot does not change visible pages, canonical URLs, page copy, structured-data claims, sitemap membership, or HTML rendering. It adds a public service endpoint and documents it through OpenAPI, llms files, MCP discovery, the agent card, the AI catalog, and the API catalog.

Expected effects:

- SEO: neutral for normal page ranking because no indexable duplicate page or hidden text is added.
- AEO and GEO: potentially positive because agents receive more explicit service-fit, evidence, and procurement guidance.
- Crawler safety: normal GET page traffic is not rate limited by the API rule.
- Training policy: unchanged at `search=yes, ai-input=yes, ai-train=no`.

No ranking, citation, or lead outcome is guaranteed.

## Advancement Path

### Phase 1: Current Pilot

Deterministic public facts, safe classification, RFQ preparation guidance, unanswered-question review, no paid model, no database.

### Phase 2: Approved Public Retrieval

Add more approved public buyer questions and citations. Keep every answer traceable to a public a2b source. Add multilingual agent responses only after native-language review.

### Phase 3: Consent-Gated Lead Handoff

Only after separate owner approval, let an agent prepare a structured lead and ask its user for explicit approval before sending. Use a dedicated backend lead intake, field allowlists, anti-spam controls, retention limits, and audit evidence. Do not connect the concierge directly to email or CRM before that review.

### Phase 4: Human Interface

Consider a visible human concierge only after the agent pilot proves common questions, value, and acceptable abuse levels. Human chat needs separate UX, accessibility, privacy notice, consent, analytics, and support ownership.

## Success Measures

1. New external agent requests to the concierge and MCP endpoints.
2. Percentage of answered versus unanswered questions.
3. Percentage of good-fit buyer or procurement intent.
4. Number of RFQ or inquiry preparation next steps.
5. Repeated unanswered topics that justify a public content improvement.
6. Qualified leads later attributable to agent-assisted discovery.
7. Abuse rate, blocked requests, false positives, and endpoint error rate.

## Rollback

1. If activated later, disable the Cloudflare path-level rate rule if it blocks legitimate agents.
2. Remove the concierge links from discovery files.
3. Remove `api/agent-concierge.js` and its shared engine.
4. Remove `ask_agent_concierge` from MCP and WebMCP.
5. Redeploy the prior verified Vercel deployment.

The normal website, Markdown negotiation, SEO metadata, forms, analytics, and existing read-only public resources remain independent of the concierge and should continue operating during rollback.
