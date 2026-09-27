#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://www.a2b.sa';
const VERSION = '1.0.0';

const COMMANDS = {
  overview: { tool: 'get_company_overview', args: [] },
  services: { tool: 'list_services', args: [] },
  areas: { tool: 'list_service_areas', args: [] },
  procurement: { tool: 'get_procurement_profile', args: [] },
  tools: { method: 'tools/list', args: [] },
  match: { tool: 'match_project_scope', args: ['query'] },
  ask: { tool: 'ask_agent_concierge', args: ['question'] },
  resource: { tool: 'read_public_resource', args: ['resourceId'] }
};

function usage() {
  return `a2b public agent CLI v${VERSION}

Usage:
  a2b overview
  a2b services
  a2b areas
  a2b procurement
  a2b tools
  a2b match <project description>
  a2b ask <public-facts question>
  a2b resource <resource-id>

Options:
  --base-url <url>  MCP host (default: ${DEFAULT_BASE_URL})
  --json            Print the full JSON-RPC response
  --help            Show this help
  --version         Show the CLI version

This CLI is read-only. It does not submit forms, send email, call phone
numbers, quote pricing, confirm availability, or create commitments.`;
}

function fail(message, code = 1) {
  process.stderr.write(`a2b: ${message}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  let baseUrl = DEFAULT_BASE_URL;
  let json = false;
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--base-url') {
      baseUrl = argv[index + 1] || fail('--base-url requires a URL');
      index += 1;
    } else if (value === '--json') {
      json = true;
    } else if (value === '--help' || value === '-h') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (value === '--version' || value === '-v') {
      process.stdout.write(`${VERSION}\n`);
      process.exit(0);
    } else if (value.startsWith('-')) {
      fail(`unknown option: ${value}`);
    } else {
      positional.push(value);
    }
  }

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    fail('--base-url must be a valid http(s) URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) fail('--base-url must use http or https');

  return { baseUrl: parsed.origin, json, positional };
}

function makeRequest(command, values) {
  const definition = COMMANDS[command];
  if (!definition) fail(`unknown command: ${command || '(missing)'}\n\n${usage()}`);
  if (values.length < definition.args.length) {
    fail(`${command} requires ${definition.args.map((name) => `<${name}>`).join(' ')}`);
  }
  if (definition.method) return { jsonrpc: '2.0', id: 1, method: definition.method };

  const joined = values.join(' ').trim();
  const args = definition.args.length ? { [definition.args[0]]: joined } : {};
  return {
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: definition.tool, arguments: args }
  };
}

function textContent(result) {
  const blocks = result?.content;
  if (!Array.isArray(blocks)) return null;
  const texts = blocks.filter((block) => block?.type === 'text' && typeof block.text === 'string');
  return texts.length ? texts.map((block) => block.text).join('\n') : null;
}

const { baseUrl, json, positional } = parseArgs(process.argv.slice(2));
if (!positional.length) {
  process.stdout.write(`${usage()}\n`);
  process.exit(0);
}

const [command, ...values] = positional;
const request = makeRequest(command, values);
let response;
try {
  response = await fetch(`${baseUrl}/api/mcp`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': `a2b-public-cli/${VERSION}` },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(15000)
  });
} catch (error) {
  fail(`request failed: ${error.message}`);
}

let body;
try {
  body = await response.json();
} catch {
  fail(`server returned non-JSON response (${response.status})`);
}
if (!response.ok) fail(`server returned HTTP ${response.status}: ${JSON.stringify(body)}`);
if (body?.error) fail(`MCP ${body.error.code}: ${body.error.message}`);

if (json) {
  process.stdout.write(`${JSON.stringify(body, null, 2)}\n`);
} else if (command === 'tools') {
  for (const tool of body?.result?.tools || []) process.stdout.write(`${tool.name}\t${tool.description || ''}\n`);
} else {
  const printable = body?.result?.structuredContent ?? textContent(body?.result) ?? body?.result;
  process.stdout.write(`${typeof printable === 'string' ? printable : JSON.stringify(printable, null, 2)}\n`);
}
