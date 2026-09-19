import { readFile, readdir } from 'node:fs/promises';
import { parse, serialize } from 'parse5';
import { createHash } from 'node:crypto';
import { checkProductionHealth } from './check-production-health.mjs';
const base = 'https://www.a2b.sa';
const locales = ['', '/ar', '/de', '/it', '/es', '/fr', '/zh-Hans'];
const pagePaths = ['', '/fleet', '/careers', '/vendors', '/services/trucking-road-freight', '/services/warehousing', '/services/customs-clearance', '/services/supply-chain', '/services/fleet-types'];
const routes = locales.flatMap(locale => pagePaths.map(path => ({ route: locale + path || '/' }))).concat([{ route: '/privacy-policy' }, { route: '/terms-and-conditions' }]);
const manifest = JSON.parse(await readFile('data/markdown-companions.json')).routes;
if (JSON.stringify(routes.map(r => r.route).sort()) !== JSON.stringify(manifest.map(r => r.route).sort())) throw new Error('Release verifier route inventory must match the public manifest.');
// Compare parsed HTML, excluding only Cloudflare's known edge-added monitoring node.
function normalizeHtml(value) {
  const tree = parse(value);
  function visit(node) {
    const children = node.childNodes || [];
    for (let index = children.length - 1; index >= 0; index--) {
      const child = children[index];
      const source = child.attrs?.find(attr => attr.name === 'src')?.value;
      if (child.tagName === 'script' && source && /^https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js(?:\/[^?#]+)?$/.test(source)) {
        if (children[index + 1]?.nodeName === '#text' && !children[index + 1].value.trim()) children.splice(index + 1, 1);
        children.splice(index, 1);
      } else visit(child);
    }
    if (node.tagName === 'body' && children.at(-1)?.nodeName === '#text') children.at(-1).value = children.at(-1).value.trimEnd();
  }
  visit(tree);
  return serialize(tree);
}
const hash = value => createHash('sha256').update(value).digest('hex');
const results = [];
for (const route of routes) {
  const stem = route.route.slice(1);
  let file = route.route === '/' ? 'index.html' : stem + '.html';
  let source;
  try { source = await readFile(file, 'utf8'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    file = stem + '/index.html';
    source = await readFile(file, 'utf8');
  }
  try {
    const response = await fetch(base + route.route, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'A2B-Release-Verification/1.0', Accept: 'text/html' } });
    results.push({ route: route.route, status: response.status, matchesCheckout: response.status === 200 && hash(normalizeHtml(await response.text())) === hash(normalizeHtml(source)) });
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
