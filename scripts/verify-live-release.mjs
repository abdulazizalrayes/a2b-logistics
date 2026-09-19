import { readFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { checkProductionHealth } from './check-production-health.mjs';
const base = 'https://www.a2b.sa';
const routes = JSON.parse(await readFile('data/markdown-companions.json')).routes;
// Cloudflare injects this monitoring tag at the edge; compare all other HTML bytes exactly.
const normalizeHtml = value => value.replace(/<script\b(?=[^>]*\bsrc="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js(?:\/[^"]*)?")[^>]*><\/script>\s*/g, '');
const hash = value => createHash('sha256').update(value).digest('hex');
const results = [];
for (const route of routes) {
  const stem = route.route.slice(1);
  let file = route.route === '/' ? 'index.html' : stem + '.html';
  try { await stat(file); } catch { file = stem + '/index.html'; }
  try {
    const response = await fetch(base + route.route, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'A2B-Release-Verification/1.0', Accept: 'text/html' } });
    results.push({ route: route.route, status: response.status, matchesCheckout: response.status === 200 && hash(normalizeHtml(await response.text())) === hash(await readFile(file, 'utf8')) });
  } catch { results.push({ route: route.route, status: null, matchesCheckout: false }); }
}
const assets = ['webmcp.js'];
for (const directory of ['assets/css','assets/js']) {
  for (const name of await readdir(directory)) if (/\.(css|js)$/.test(name)) assets.push(`${directory}/${name}`);
}
for (const file of assets) {
  try {
    const response = await fetch(`${base}/${file}`, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    results.push({ route: `/${file}`, status: response.status, matchesCheckout: response.status === 200 && hash(await response.text()) === hash(await readFile(file, 'utf8')) });
  } catch { results.push({ route: `/${file}`, status: null, matchesCheckout: false }); }
}
for (const path of ['/CLAUDE.md','/docs/AGENT_CONCIERGE_SECURITY_AND_LEAD_PLAN.md','/scripts/verify-site.mjs','/screenshots/01_hero.png']) {
  try {
    const response = await fetch(base + path, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    results.push({ route: path, status: response.status, privatePathDenied: response.status === 404 });
  } catch { results.push({ route: path, status: null, privatePathDenied: false }); }
}
const health = await checkProductionHealth();
const passed = health.healthy && results.every(r => r.matchesCheckout ?? r.privatePathDenied);
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), passed, results, health }, null, 2));
if (!passed) process.exitCode = 1;
