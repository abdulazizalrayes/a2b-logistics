import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const catalog = JSON.parse(await readFile(join(root, 'data/analytics-events.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const outDir = join(root, 'reports');
const outFile = join(outDir, `agent-analytics-report-${today}.md`);

const eventList = catalog.events.map((event) => `- ${event.name}: ${event.purpose}`).join('\n');

const body = `# a2b AI And Agent Analytics Report

Date: ${today}
Company: a2b only

## Events To Check

${eventList}

## GA4 Observations

- mcp_tool_call:
- mcp_resource_read:
- inquiry_preparation:
- contact_click:
- form_submit_attempt:
- AI/referral traffic:

## Vercel/CDN Observations

Paths:

- /api/mcp:
- /llms.txt:
- /llms-full.txt:
- /openapi.json:
- /.well-known/:
- /data/:

## Search Console Observations

- Indexed discovery files:
- Crawled but not indexed:
- Errors:

## Findings

- 

## Recommended Improvements

- 

## Owner Decisions Needed

- 
`;

await mkdir(outDir, { recursive: true });
await writeFile(outFile, body);

console.log(`Created ${outFile}.`);
