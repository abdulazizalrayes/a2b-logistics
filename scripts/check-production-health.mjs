import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = 'https://www.a2b.sa';
const SIGNAL = 'search=yes, ai-input=yes, ai-train=no';
export const probes = [
  { id: 'home', path: '/', type: 'text/html', canonical: `${BASE}/` },
  { id: 'supply-chain', path: '/services/supply-chain', type: 'text/html', canonical: `${BASE}/services/supply-chain` },
  { id: 'road-freight', path: '/services/trucking-road-freight', type: 'text/html', canonical: `${BASE}/services/trucking-road-freight` },
  { id: 'markdown', path: '/', accept: 'text/markdown', type: 'text/markdown' },
  { id: 'concierge-method', path: '/api/agent-concierge', status: 405 },
  { id: 'mcp-discovery', path: '/api/mcp', method: 'POST', type: 'application/json' },
  { id: 'sitemap', path: '/sitemap.xml', type: 'xml' }
];

export async function checkProductionHealth(request = fetch) {
  const startedAt = new Date().toISOString();
  const checks = [];
  // Sequential requests; no questions, contact submissions, retries or burst tests.
  for (const probe of probes) {
    const started = Date.now();
    const row = { id: probe.id, status: null, ok: false, reasons: [] };
    try {
      const response = await request(`${BASE}${probe.path}`, {
        method: probe.method || 'GET', redirect: 'error', signal: AbortSignal.timeout(15000),
        headers: { Accept: probe.accept || '*/*', 'User-Agent': 'A2B-Synthetic-Health/1.0', ...(probe.method ? { 'Content-Type': 'application/json' } : {}) },
        ...(probe.method ? { body: JSON.stringify({ jsonrpc: '2.0', id: 'a2b-health', method: 'tools/list' }) } : {})
      });
      row.status = response.status;
      if (response.status !== (probe.status || 200)) row.reasons.push('unexpected_status');
      if (probe.type && !(response.headers.get('content-type') || '').includes(probe.type)) row.reasons.push('wrong_content_type');
      if (probe.id !== 'sitemap' && response.headers.get('content-signal') !== SIGNAL) row.reasons.push('content_signal_mismatch');
      const body = await response.text();
      if (probe.canonical && !body.includes(`rel="canonical" href="${probe.canonical}"`)) row.reasons.push('canonical_mismatch');
      if (probe.id === 'concierge-method' && !/\bPOST\b/.test(response.headers.get('allow') || '')) row.reasons.push('missing_allow_post');
      if (probe.id === 'mcp-discovery') {
        try {
          const data = JSON.parse(body);
          if (!data.result?.tools?.some(tool => tool.name === 'ask_agent_concierge')) row.reasons.push('concierge_tool_missing');
        } catch { row.reasons.push('invalid_json'); }
      }
      if (probe.id === 'sitemap' && (!body.includes('<urlset') || !body.includes(`${BASE}/services/supply-chain`))) row.reasons.push('invalid_sitemap');
      row.ok = row.reasons.length === 0;
    } catch { row.reasons.push('request_failed_or_timed_out'); }
    row.durationMs = Date.now() - started;
    checks.push(row);
  }
  return { schemaVersion: 1, company: 'a2b', kind: 'synthetic-health', startedAt, endedAt: new Date().toISOString(), healthy: checks.every(row => row.ok), checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await checkProductionHealth();
  const output = process.argv[2];
  if (output) {
    await mkdir(dirname(resolve(output)), { recursive: true });
    await writeFile(output, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify(result, null, 2));
  if (!result.healthy) process.exitCode = 1;
}
