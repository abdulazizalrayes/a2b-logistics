import assert from 'node:assert/strict';
import { checkProductionHealth, probes } from './check-production-health.mjs';

function healthy(url, options) {
  const probe = probes.find(p => url.endsWith(p.path) && (p.accept || '*/*') === options.headers.Accept && (p.method || 'GET') === options.method);
  const headers = { 'content-type': probe.type || 'application/json', 'content-signal': 'search=yes, ai-input=yes, ai-train=no', allow: 'POST, OPTIONS' };
  const body = probe.canonical ? `<link rel="canonical" href="${probe.canonical}">` : probe.id === 'mcp-discovery' ? JSON.stringify({ result: { tools: [{ name: 'ask_agent_concierge' }] } }) : probe.id === 'sitemap' ? '<urlset>https://www.a2b.sa/services/supply-chain</urlset>' : 'public content';
  return new Response(body, { status: probe.status || 200, headers });
}
assert.equal((await checkProductionHealth(healthy)).healthy, true);
const failure = await checkProductionHealth((url, options) => url.endsWith('/services/supply-chain') ? new Response('private diagnostic must not be retained', { status: 503 }) : healthy(url, options));
assert.equal(failure.healthy, false);
assert.ok(!JSON.stringify(failure).includes('private diagnostic'));
assert.equal(failure.checks.find(c => c.id === 'supply-chain').status, 503);
assert.equal((await checkProductionHealth(healthy)).healthy, true, 'recovery is detected');
const timeout = await checkProductionHealth(() => { throw new Error('secret=do-not-log'); });
assert.equal(timeout.healthy, false);
assert.ok(!JSON.stringify(timeout).includes('secret'));
assert.equal(timeout.checks.length, probes.length);
console.log('Production monitor: healthy, failure, recovery and redacted error checks passed.');
