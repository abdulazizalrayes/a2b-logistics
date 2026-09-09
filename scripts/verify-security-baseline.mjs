import { readFile } from 'node:fs/promises';

const errors = [];

function fail(message) {
  errors.push(message);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

const packageJson = await readJson('package.json');
if (packageJson.engines?.node !== '24.x') {
  fail('package.json: Node.js must stay pinned to the supported 24.x LTS major');
}

const securityText = await readFile('.well-known/security.txt', 'utf8');
const fields = new Map(
  securityText
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(':');
      return [line.slice(0, separator), line.slice(separator + 1).trim()];
    })
);

if (fields.get('Contact') !== 'mailto:info@a2b.sa') {
  fail('.well-known/security.txt: security contact must be info@a2b.sa');
}
if (fields.get('Canonical') !== 'https://www.a2b.sa/.well-known/security.txt') {
  fail('.well-known/security.txt: canonical URL is missing or incorrect');
}
if (fields.get('Preferred-Languages') !== 'en, ar') {
  fail('.well-known/security.txt: preferred languages must be English and Arabic');
}

const expiresAt = Date.parse(fields.get('Expires') || '');
const now = Date.now();
const maximumLifetime = 366 * 24 * 60 * 60 * 1000;
if (!Number.isFinite(expiresAt) || expiresAt <= now) {
  fail('.well-known/security.txt: Expires must be a valid future date');
} else if (expiresAt - now > maximumLifetime) {
  fail('.well-known/security.txt: Expires must be no more than one year ahead');
}

const vercel = await readJson('vercel.json');
const globalHeaders = new Map(
  (vercel.headers || [])
    .find((entry) => entry.source === '/(.*)')
    ?.headers?.map(({ key, value }) => [key.toLowerCase(), value]) || []
);

for (const required of [
  'content-security-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'permissions-policy',
  'referrer-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options'
]) {
  if (!globalHeaders.has(required)) fail(`vercel.json: missing ${required} security header`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('a2b security baseline passed: Node LTS, security.txt, and production headers verified.');
