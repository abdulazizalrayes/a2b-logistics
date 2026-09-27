import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'cli', 'a2b.mjs');
const server = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  response.setHeader('content-type', 'application/json');
  if (body.method === 'tools/list') {
    response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: { tools: [{ name: 'get_company_overview', description: 'Overview' }] } }));
    return;
  }
  response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result: { structuredContent: { tool: body.params.name, arguments: body.params.arguments, submitted: false }, content: [{ type: 'text', text: 'mock result' }] } }));
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const execFileAsync = promisify(execFile);
const run = async (...args) => {
  try {
    const result = await execFileAsync(process.execPath, [cli, ...args, '--base-url', baseUrl], { encoding: 'utf8' });
    return { status: 0, ...result };
  } catch (error) {
    return { status: error.code || 1, stdout: error.stdout || '', stderr: error.stderr || '' };
  }
};

try {
  const overview = await run('overview', '--json');
  assert.equal(overview.status, 0, overview.stderr);
  assert.equal(JSON.parse(overview.stdout).result.structuredContent.tool, 'get_company_overview');
  const match = await run('match', 'factory', 'freight', 'to', 'Riyadh', '--json');
  assert.equal(match.status, 0, match.stderr);
  assert.equal(JSON.parse(match.stdout).result.structuredContent.arguments.query, 'factory freight to Riyadh');
  const ask = await run('ask', 'Do you support road freight?', '--json');
  assert.equal(ask.status, 0, ask.stderr);
  assert.equal(JSON.parse(ask.stdout).result.structuredContent.arguments.question, 'Do you support road freight?');
  const tools = await run('tools');
  assert.equal(tools.status, 0, tools.stderr);
  assert.match(tools.stdout, /get_company_overview/);
  const invalid = await run('unknown');
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /unknown command/);
  console.log('Public CLI checks passed.');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
