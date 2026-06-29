import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const input = JSON.parse(await readFile(join(root, 'data/ai-visibility-queries.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const outDir = join(root, 'reports');
const outFile = join(outDir, `ai-visibility-benchmark-${today}.json`);

const rows = [];
for (const group of input.querySets) {
  for (const query of group.queries) {
    for (const engine of input.measurementTargets) {
      rows.push({
        date: today,
        company: input.company,
        category: group.category,
        engine,
        query,
        a2bMentioned: null,
        a2bRankOrPosition: null,
        citedUrls: [],
        factsCorrect: null,
        incorrectClaims: [],
        competitorsMentioned: [],
        recommendedContentFix: '',
        ownerActionNeeded: ''
      });
    }
  }
}

await mkdir(outDir, { recursive: true });
await writeFile(outFile, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: 'data/ai-visibility-queries.json',
  instructions: 'Fill this scorecard manually from owner-approved search/AI engine checks. Do not use paid tools without approval.',
  rows
}, null, 2)}\n`);

console.log(`Created ${outFile} with ${rows.length} benchmark rows.`);
