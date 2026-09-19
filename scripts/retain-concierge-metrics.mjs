import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const keys = new Set(['company', 'project', 'environment', 'windowStart', 'windowEnd', 'coverage', 'sourceCoverage', 'answered', 'unanswered', 'duplicates', 'excludedSynthetic', 'rateLimited', 'serverErrors']);
const countKeys = ['answered', 'unanswered', 'duplicates', 'excludedSynthetic', 'rateLimited', 'serverErrors'];
export function validateSnapshot(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !keys.has(key))) throw new Error('Only allowlisted aggregate fields are accepted.');
  if (input.company !== 'a2b' || input.project !== 'a2b-logistics' || input.environment !== 'production') throw new Error('A2B production identity required.');
  for (const key of ['windowStart', 'windowEnd']) {
    if (typeof input[key] !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(input[key]) || !Number.isFinite(Date.parse(input[key]))) throw new Error('UTC coverage timestamps required.');
  }
  if (Date.parse(input.windowStart) >= Date.parse(input.windowEnd)) throw new Error('Coverage window must have positive duration.');
  if (!['complete', 'partial', 'unavailable'].includes(input.coverage)) throw new Error('Explicit coverage state required.');
  if (!['direct-only', 'direct-and-mcp', 'unknown'].includes(input.sourceCoverage)) throw new Error('Explicit source coverage required.');
  for (const key of countKeys) {
    if (input[key] !== null && (!Number.isSafeInteger(input[key]) || input[key] < 0)) throw new Error('Counts must be nonnegative integers or null when unknown.');
  }
  if (input.coverage === 'unavailable' && countKeys.some(key => input[key] !== null)) throw new Error('Unavailable coverage cannot be represented as zero traffic.');
  return Object.fromEntries([...keys].map(key => [key, input[key]]));
}

export function retainSnapshots(existing, input, now = Date.now()) {
  const snapshot = validateSnapshot(input);
  const id = item => `${item.windowStart}/${item.windowEnd}/${item.sourceCoverage}`;
  const retained = existing.map(validateSnapshot).filter(item => Date.parse(item.windowEnd) >= now - 90 * 86400000 && id(item) !== id(snapshot));
  if (Date.parse(snapshot.windowEnd) < now - 90 * 86400000 || Date.parse(snapshot.windowEnd) > now + 60000) throw new Error('Snapshot lies outside retention or in the future.');
  // These are window snapshots, not additive totals: overlapping windows remain explicit.
  return [...retained, snapshot].sort((a, b) => Date.parse(a.windowEnd) - Date.parse(b.windowEnd));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , inputFile, archiveFile] = process.argv;
  if (!inputFile || !archiveFile) throw new Error('Usage: node scripts/retain-concierge-metrics.mjs INPUT.json PRIVATE_ARCHIVE.json');
  let existing = [];
  try { existing = JSON.parse(await readFile(archiveFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const retained = retainSnapshots(existing, JSON.parse(await readFile(inputFile, 'utf8')));
  await mkdir(dirname(resolve(archiveFile)), { recursive: true });
  const temporary = `${archiveFile}.new`;
  await writeFile(temporary, JSON.stringify(retained, null, 2) + '\n', { mode: 0o600 });
  const { rename } = await import('node:fs/promises');
  await rename(temporary, archiveFile);
  console.log(`Retained ${retained.length} aggregate snapshots; no question text or identifiers stored.`);
}
