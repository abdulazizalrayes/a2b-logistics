import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const requiredHomeHreflangs = ['en', 'ar', 'ar-SA', 'de', 'it', 'es', 'fr', 'zh-Hans', 'x-default'];
const serviceSlugs = ['trucking-road-freight', 'warehousing', 'customs-clearance', 'supply-chain', 'fleet-types'];
const servicePrefixes = ['', 'ar', 'de', 'it', 'es', 'fr', 'zh-Hans'];
const homePages = ['index.html', 'ar/index.html', 'de/index.html', 'it/index.html', 'es/index.html', 'fr/index.html', 'zh-Hans/index.html'];
const requiredAgentFiles = [
  'data/company.json',
  'data/services.json',
  'data/capabilities.json',
  'data/service-areas.json',
  'data/project-inquiry-schema.json',
  'data/agent-routing.json',
  'llms.txt',
  'llms-full.txt',
  '.well-known/agent-card.json',
  '.well-known/api-catalog',
  '.well-known/mcp.json',
  '.well-known/mcp/server-card.json',
  '.well-known/mcp/server-cards.json',
  '.well-known/agent-skills/index.json',
  'openapi.json',
  'auth.md',
  'api/mcp.js',
  'webmcp.js',
  'robots.txt'
];

const errors = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.vercel') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    if (entry.isFile()) files.push(full);
  }
  return files;
}

function fail(message) {
  errors.push(message);
}

function extractJsonLd(html, file) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const [index, match] of blocks.entries()) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      fail(`${file}: JSON-LD block ${index + 1} is invalid: ${error.message}`);
    }
  }
  return blocks.length;
}

function requireHreflangs(html, file, expected) {
  for (const hreflang of expected) {
    if (!html.includes(`hreflang="${hreflang}"`)) {
      fail(`${file}: missing hreflang="${hreflang}"`);
    }
  }
}

function requireIncludes(html, file, needle, label) {
  if (!html.includes(needle)) fail(`${file}: missing ${label}`);
}

async function readRequired(file) {
  try {
    return await readFile(join(root, file), 'utf8');
  } catch (error) {
    fail(`${file}: missing required agent-readiness file`);
    return '';
  }
}

async function parseRequiredJson(file) {
  const text = await readRequired(file);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${file}: invalid JSON: ${error.message}`);
    return {};
  }
}

for (const file of homePages) {
  const html = await readFile(join(root, file), 'utf8');
  requireHreflangs(html, file, requiredHomeHreflangs);
  requireIncludes(html, file, 'application/ld+json', 'JSON-LD');
  requireIncludes(html, file, 'FAQPage', 'FAQPage schema');
  requireIncludes(html, file, 'G-909SV0D9FM', 'GA4 measurement ID');
  extractJsonLd(html, file);

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) fail(`${file}: missing canonical URL`);
  if (canonical && canonical[1].includes('?')) fail(`${file}: canonical URL must not include query parameters`);
}

for (const prefix of servicePrefixes) {
  for (const slug of serviceSlugs) {
    const file = prefix ? `${prefix}/services/${slug}/index.html` : `services/${slug}/index.html`;
    const html = await readFile(join(root, file), 'utf8');
    requireHreflangs(html, file, requiredHomeHreflangs);
    requireIncludes(html, file, 'Service', 'Service schema');
    requireIncludes(html, file, 'BreadcrumbList', 'BreadcrumbList schema');
    requireIncludes(html, file, 'G-909SV0D9FM', 'GA4 measurement ID');
    extractJsonLd(html, file);
  }
}

const textFiles = (await walk(root)).filter((file) => /\.(html|xml|txt|md|json|js|css)$/i.test(file));
for (const full of textFiles) {
  const file = relative(root, full);
  const text = await readFile(full, 'utf8');
  if (text.includes('+966-11-510-1861')) fail(`${file}: old landline is still present`);
  if (text.includes('\u05aa')) fail(`${file}: stray U+05AA mark is present`);
}

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const sitemapUrlCount = (sitemap.match(/<loc>/g) || []).length;
if (sitemapUrlCount < 65) fail(`sitemap.xml: expected at least 65 URLs, found ${sitemapUrlCount}`);

const analytics = await readFile(join(root, 'assets/js/analytics.js'), 'utf8');
requireIncludes(analytics, 'assets/js/analytics.js', 'contact_click', 'contact click analytics event');
requireIncludes(analytics, 'assets/js/analytics.js', 'form_submit_attempt', 'form submit analytics event');

for (const file of requiredAgentFiles) {
  await stat(join(root, file)).catch(() => fail(`${file}: required file is missing`));
}

const company = await parseRequiredJson('data/company.json');
const services = await parseRequiredJson('data/services.json');
const capabilities = await parseRequiredJson('data/capabilities.json');
const serviceAreas = await parseRequiredJson('data/service-areas.json');
const inquirySchema = await parseRequiredJson('data/project-inquiry-schema.json');
const routing = await parseRequiredJson('data/agent-routing.json');
const agentCard = await parseRequiredJson('.well-known/agent-card.json');
const mcp = await parseRequiredJson('.well-known/mcp.json');
const mcpServerCard = await parseRequiredJson('.well-known/mcp/server-card.json');
const mcpServerCards = await parseRequiredJson('.well-known/mcp/server-cards.json');
const agentSkills = await parseRequiredJson('.well-known/agent-skills/index.json');
const openapi = await parseRequiredJson('openapi.json');
JSON.parse(await readRequired('.well-known/api-catalog'));

if (company.name !== 'a2b Logistics Company') fail('data/company.json: wrong company name');
if (company.primaryDomain !== 'www.a2b.sa') fail('data/company.json: wrong primary domain');
if (!Array.isArray(company.sameAs) || !company.sameAs.includes('https://www.linkedin.com/company/helloa2bco')) fail('data/company.json: missing verified LinkedIn sameAs');
if (company.geo?.status !== 'not_published') fail('data/company.json: do not publish unverified coordinates');
if (!Array.isArray(services.services) || services.services.length < 5) fail('data/services.json: expected at least five services');
if (!Array.isArray(capabilities.approvalBoundaries) || !capabilities.approvalBoundaries.join(' ').includes('Do not submit forms')) fail('data/capabilities.json: missing approval boundary');
if (!Array.isArray(serviceAreas.areas) || !serviceAreas.areas.some((area) => area.id === 'saudi-arabia')) fail('data/service-areas.json: missing Saudi Arabia');
if (!inquirySchema.properties?.approvalToContact) fail('data/project-inquiry-schema.json: missing approvalToContact');
if (!routing.routes?.some((route) => route.id === 'non-fit' && route.doNotRouteToProjectInquiry)) fail('data/agent-routing.json: missing non-fit routing');

const requiredTools = ['get_company_overview', 'list_services', 'match_project_scope', 'prepare_project_inquiry', 'list_service_areas', 'read_public_resource'];
for (const tool of requiredTools) {
  if (!JSON.stringify(agentCard).includes(tool)) fail(`.well-known/agent-card.json: missing ${tool}`);
  if (!JSON.stringify(mcp).includes(tool)) fail(`.well-known/mcp.json: missing ${tool}`);
  if (!JSON.stringify(mcpServerCard).includes(tool)) fail(`.well-known/mcp/server-card.json: missing ${tool}`);
}

if (!mcp.endpoint?.endsWith('/api/mcp')) fail('.well-known/mcp.json: endpoint must be /api/mcp');
if (!mcpServerCards.servers?.some((server) => server.url?.endsWith('/.well-known/mcp/server-card.json'))) fail('.well-known/mcp/server-cards.json: missing server card URL');
if (!agentSkills.skills?.length) fail('.well-known/agent-skills/index.json: missing skills');
if (openapi.openapi !== '3.1.0') fail('openapi.json: expected OpenAPI 3.1.0');
for (const path of ['/data/company.json', '/data/services.json', '/data/capabilities.json', '/data/service-areas.json', '/data/project-inquiry-schema.json', '/data/agent-routing.json', '/api/mcp']) {
  if (!openapi.paths?.[path]) fail(`openapi.json: missing ${path}`);
}

const llms = await readRequired('llms.txt');
const llmsFull = await readRequired('llms-full.txt');
const robots = await readRequired('robots.txt');
const webmcp = await readRequired('webmcp.js');
const mcpApi = await readRequired('api/mcp.js');
for (const needle of ['/data/company.json', '/data/services.json', '/data/agent-routing.json', '/api/mcp', 'prepare_project_inquiry']) {
  requireIncludes(llms, 'llms.txt', needle, needle);
  requireIncludes(llmsFull, 'llms-full.txt', needle, needle);
}
requireIncludes(robots, 'robots.txt', 'Disallow: /admin/', 'admin block');
requireIncludes(robots, 'robots.txt', 'Allow: /data/', 'data allow');
requireIncludes(webmcp, 'webmcp.js', 'prepare_project_inquiry', 'safe inquiry tool');
requireIncludes(webmcp, 'webmcp.js', 'approvalRequiredBeforeContact', 'contact approval guard');
requireIncludes(mcpApi, 'api/mcp.js', 'prepare_project_inquiry', 'MCP inquiry tool');
requireIncludes(mcpApi, 'api/mcp.js', 'mcp_tool_call', 'MCP analytics log');
if (webmcp.includes('request_quote')) fail('webmcp.js: request_quote should not be exposed');
if (JSON.stringify(agentCard).includes('request_quote')) fail('.well-known/agent-card.json: request_quote should not be exposed');

await stat(join(root, 'CLAUDE.md'));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`a2b verification passed: ${homePages.length} homepages, ${servicePrefixes.length * serviceSlugs.length} service pages, ${sitemapUrlCount} sitemap URLs.`);
