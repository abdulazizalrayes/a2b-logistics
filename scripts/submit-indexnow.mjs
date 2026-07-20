import { readFile, writeFile } from 'node:fs/promises';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_FILE = 'dabfa5738883df4a66f9ad844188f7aa.txt';
const CANONICAL_HOST = 'www.a2b.sa';
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run') || args.has('--check');

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function assertCanonicalUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error(`${url}: IndexNow URL must use HTTPS`);
  if (parsed.host !== CANONICAL_HOST) throw new Error(`${url}: IndexNow URL must be on ${CANONICAL_HOST}`);
  if (parsed.pathname.endsWith('.md')) throw new Error(`${url}: Markdown sidecars must not be submitted to IndexNow`);
}

const key = (await readFile(KEY_FILE, 'utf8')).trim();
const urlList = sitemapUrls(await readFile('sitemap.xml', 'utf8'));

if (!key) throw new Error(`${KEY_FILE}: missing IndexNow key`);
if (urlList.length === 0) throw new Error('sitemap.xml: no URLs found');
for (const url of urlList) assertCanonicalUrl(url);

const payload = {
  host: CANONICAL_HOST,
  key,
  keyLocation: `https://${CANONICAL_HOST}/${KEY_FILE}`,
  urlList,
};

const summary = {
  endpoint: INDEXNOW_ENDPOINT,
  host: payload.host,
  keyLocation: payload.keyLocation,
  urlCount: payload.urlList.length,
  firstUrl: payload.urlList[0],
  lastUrl: payload.urlList.at(-1),
  dryRun,
};

if (dryRun) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

const response = await fetch(INDEXNOW_ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

const evidence = {
  ...summary,
  submittedAt: new Date().toISOString(),
  status: response.status,
  statusText: response.statusText,
};

await writeFile('/tmp/a2b-indexnow-last-submission.json', JSON.stringify(evidence, null, 2));

if (!response.ok) {
  console.error(JSON.stringify(evidence, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(evidence, null, 2));
