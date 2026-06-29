# AI Visibility Benchmark

Date: 2026-06-29
Company: a2b only

## Purpose

Measure whether AI answer engines, search engines, and procurement agents can correctly find, cite, and route a2b Logistics.

This is not paid advertising and does not use paid backlinks. It is an evidence loop for improving public, verifiable information.

## Monthly Benchmark Inputs

Use `/data/ai-visibility-queries.json` as the query set.

Targets:

- Google Search
- Bing
- ChatGPT retrieval or browsing mode, if available
- Gemini
- Perplexity
- Copilot
- Other owner-approved answer engines

## Scorecard

Track these fields for each query:

- engine
- query
- date
- a2b mentioned: yes/no
- rank or answer position
- cited URLs
- facts correct: yes/no
- incorrect claims
- competitors mentioned
- recommended content fix
- owner action needed

## What Good Looks Like

Top-tier performance means:

- a2b appears for brand queries with correct entity facts.
- a2b appears or is citeable for B2B Saudi logistics intent.
- AI systems route non-fit consumer/career/vendor requests correctly.
- Answers cite canonical URLs, not random or unrelated pages.
- No invented claims about fleet counts, certifications, pricing, or availability.

## Testing Command

Create a blank monthly scorecard:

```sh
node scripts/ai-visibility-benchmark.mjs
```

This script does not call paid AI/search tools. It generates the repeatable benchmark worksheet from public query definitions.

## Governance

Record each monthly benchmark summary in Paperclip for a2b only.

Do not mix results from JFCO, TICC, NAPCO, or any other company.
