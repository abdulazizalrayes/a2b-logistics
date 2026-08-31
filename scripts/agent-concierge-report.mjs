import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const inputFile = process.argv[2];
const today = new Date().toISOString().slice(0, 10);
const outDir = join(root, 'reports');
const outFile = join(outDir, `agent-concierge-questions-${today}.md`);

async function readInput() {
  if (inputFile) return readFile(inputFile, 'utf8');
  if (process.stdin.isTTY) return '';
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function parseEvents(raw) {
  const events = [];
  for (const line of raw.split(/\r?\n/)) {
    const start = line.indexOf('{');
    if (start === -1) continue;
    try {
      const event = JSON.parse(line.slice(start));
      if (event.event === 'agent_concierge_question') events.push(event);
    } catch {
      // Ignore non-JSON platform log lines.
    }
  }
  return events;
}

const events = parseEvents(await readInput());
const unanswered = new Map();
for (const event of events) {
  if (event.requiresReview && !event.duplicate && event.questionRedacted) unanswered.set(event.fingerprint, event);
}

const rows = [...unanswered.values()].map((event, index) => (
  `| ${index + 1} | ${event.questionRedacted.replaceAll('|', '\\|')} | ${event.intent || 'unanswered'} | ${event.ts || ''} | Add an approved public answer or keep unanswered |`
));

const report = `# a2b Agent Concierge Question Review

Date: ${today}
Scope: a2b only

## Summary

- Concierge events reviewed: ${events.length}
- New unanswered questions: ${unanswered.size}
- Answered question text retained: no
- Source IP addresses retained in this report: no

## New Questions

| No. | Redacted question | Intent | First seen | Recommendation |
| --- | --- | --- | --- | --- |
${rows.length ? rows.join('\n') : '| 1 | No new unanswered questions in the supplied logs. | n/a | n/a | No knowledge change needed |'}

## Review Rule

Only add an answer after verifying it against approved public a2b facts. Do not publish pricing, capacity, availability, certifications, routes, legal terms, personal data, credentials, or private-system information.
`;

await mkdir(outDir, { recursive: true });
await writeFile(outFile, report);
console.log(`Created ${outFile}.`);
