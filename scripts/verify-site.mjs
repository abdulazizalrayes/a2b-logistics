import { access, readdir, readFile, stat } from 'node:fs/promises';
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
  'data/procurement-profile.json',
  'data/vendor-onboarding-requirements.json',
  'data/compliance-profile.json',
  'data/rfq-preparation.json',
  'data/ai-visibility-queries.json',
  'data/analytics-events.json',
  'data/high-intent-content-plan.json',
  'data/markdown-companions.json',
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
  'docs/AI_VISIBILITY_BENCHMARK.md',
  'docs/ANALYTICS_AI_REPORTING.md',
  'docs/HIGH_INTENT_PAGE_APPROVAL_BRIEF.md',
  'api/mcp.js',
  'scripts/ai-visibility-benchmark.mjs',
  'scripts/agent-analytics-report.mjs',
  'scripts/generate-markdown-companions.mjs',
  'scripts/validate-markdown-layer.mjs',
  'scripts/submit-indexnow.mjs',
  'markdown-routes.mjs',
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

async function htmlPathForUrl(url) {
  const pathname = new URL(url).pathname;
  if (pathname === '/') return 'index.html';
  const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
  const candidates = clean.includes('.')
    ? [clean]
    : [`${clean}.html`, `${clean}/index.html`];
  for (const candidate of candidates) {
    if (await access(join(root, candidate)).then(() => true).catch(() => false)) return candidate;
  }
  return candidates[0];
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
  requireIncludes(html, file, '"Organization"', 'Organization schema type');
  requireIncludes(html, file, '"LocalBusiness"', 'LocalBusiness schema type');
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
    requireIncludes(html, file, '"Organization"', 'Organization schema type');
    requireIncludes(html, file, '"LocalBusiness"', 'LocalBusiness schema type');
    requireIncludes(html, file, 'Service', 'Service schema');
    requireIncludes(html, file, 'BreadcrumbList', 'BreadcrumbList schema');
    requireIncludes(html, file, 'G-909SV0D9FM', 'GA4 measurement ID');
    extractJsonLd(html, file);
  }
}

const textFiles = (await walk(root)).filter((file) => /\.(html|xml|txt|md|json|js|css)$/i.test(file));
const accidentalArtifactPattern = /(^|\/)[^/]+(?: 2| copy)\.(?:html|xml|txt|md|json|js|css)$|(^|\/)[^/]+\.(?:bak|tmp)$/i;
for (const full of textFiles) {
  const file = relative(root, full);
  const text = await readFile(full, 'utf8');
  if (accidentalArtifactPattern.test(file)) fail(`${file}: accidental duplicate/copy/temp artifact is present`);
  if (text.includes('+966-11-510-1861')) fail(`${file}: old landline is still present`);
  if (text.includes('\u05aa')) fail(`${file}: stray U+05AA mark is present`);
}

const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
const sitemapUrlCount = (sitemap.match(/<loc>/g) || []).length;
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrlCount < 65) fail(`sitemap.xml: expected at least 65 URLs, found ${sitemapUrlCount}`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) fail('sitemap.xml: duplicate URLs are present');
for (const url of sitemapUrls) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') fail(`sitemap.xml: non-HTTPS URL present: ${url}`);
  if (parsed.host !== 'www.a2b.sa') fail(`sitemap.xml: non-canonical host present: ${url}`);
  if (parsed.pathname.endsWith('.md')) fail(`sitemap.xml: Markdown sidecar must not be submitted/indexed: ${url}`);
}
for (const cancelledSlug of [
  'flatbed-trucking-riyadh',
  'lowbed-transport-saudi-arabia',
  'customs-clearance-riyadh',
  'warehousing-riyadh',
  'port-to-site-logistics-saudi-arabia',
  'gcc-cross-border-freight',
  'project-logistics-saudi-arabia'
]) {
  if (sitemap.includes(cancelledSlug)) fail(`sitemap.xml: cancelled high-intent slug is present: ${cancelledSlug}`);
}

const analytics = await readFile(join(root, 'assets/js/analytics.js'), 'utf8');
requireIncludes(analytics, 'assets/js/analytics.js', 'contact_click', 'contact click analytics event');
requireIncludes(analytics, 'assets/js/analytics.js', 'form_submit_attempt', 'form submit analytics event');

const indexNowKeyFile = 'dabfa5738883df4a66f9ad844188f7aa.txt';
const indexNowKey = (await readRequired(indexNowKeyFile)).trim();
if (indexNowKey !== 'dabfa5738883df4a66f9ad844188f7aa') fail(`${indexNowKeyFile}: unexpected IndexNow key`);
for (const url of sitemapUrls) {
  const htmlFile = await htmlPathForUrl(url);
  const html = await readFile(join(root, htmlFile), 'utf8').catch(() => {
    fail(`${htmlFile}: missing sitemap HTML file for ${url}`);
    return '';
  });
  requireIncludes(html, htmlFile, `<meta name="indexnow-key" content="${indexNowKey}`, 'IndexNow key meta');
}
const vercelConfig = await parseRequiredJson('vercel.json');
const indexNowHeaderRoutes = new Map((vercelConfig.headers || []).map((entry) => [entry.source, entry.headers || []]));
for (const route of ['/indexnow-submit', '/indexnow-submit.html']) {
  const header = indexNowHeaderRoutes.get(route)?.find((entry) => entry.key === 'X-Robots-Tag');
  if (header?.value !== 'noindex, nofollow') fail(`vercel.json: ${route} must return X-Robots-Tag noindex, nofollow`);
}

for (const file of requiredAgentFiles) {
  await stat(join(root, file)).catch(() => fail(`${file}: required file is missing`));
}

const company = await parseRequiredJson('data/company.json');
const services = await parseRequiredJson('data/services.json');
const capabilities = await parseRequiredJson('data/capabilities.json');
const serviceAreas = await parseRequiredJson('data/service-areas.json');
const inquirySchema = await parseRequiredJson('data/project-inquiry-schema.json');
const routing = await parseRequiredJson('data/agent-routing.json');
const procurementProfile = await parseRequiredJson('data/procurement-profile.json');
const vendorRequirements = await parseRequiredJson('data/vendor-onboarding-requirements.json');
const complianceProfile = await parseRequiredJson('data/compliance-profile.json');
const rfqPreparation = await parseRequiredJson('data/rfq-preparation.json');
const aiVisibilityQueries = await parseRequiredJson('data/ai-visibility-queries.json');
const analyticsEvents = await parseRequiredJson('data/analytics-events.json');
const highIntentContentPlan = await parseRequiredJson('data/high-intent-content-plan.json');
const markdownCompanions = await parseRequiredJson('data/markdown-companions.json');
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
if (!procurementProfile.procurementFit?.goodFit?.length) fail('data/procurement-profile.json: missing goodFit procurement profile');
if (!procurementProfile.commercialBoundaries?.join(' ').includes('Do not quote pricing')) fail('data/procurement-profile.json: missing commercial boundary');
if (vendorRequirements.routing?.vendorRegistrationUrl !== 'https://www.a2b.sa/vendors') fail('data/vendor-onboarding-requirements.json: vendors must route to /vendors');
if (!complianceProfile.unverifiedOrNotPublished?.includes('latitude and longitude')) fail('data/compliance-profile.json: missing unverified coordinates boundary');
if (!Array.isArray(rfqPreparation.rfqTypes) || rfqPreparation.rfqTypes.length < 4) fail('data/rfq-preparation.json: expected RFQ preparation types');
if (!Array.isArray(aiVisibilityQueries.querySets) || aiVisibilityQueries.querySets.length < 4) fail('data/ai-visibility-queries.json: expected query sets');
if (!analyticsEvents.events?.some((event) => event.name === 'mcp_tool_call')) fail('data/analytics-events.json: missing mcp_tool_call event');
if (highIntentContentPlan.status !== 'cancelled_by_owner') fail('data/high-intent-content-plan.json: high-intent plan must remain cancelled');
if (highIntentContentPlan.draftPages?.length) fail('data/high-intent-content-plan.json: cancelled high-intent plan must not contain draft pages');
if (markdownCompanions.routes?.length !== sitemapUrlCount) fail('data/markdown-companions.json: route count must match sitemap URL count');
if (markdownCompanions.contentSignal !== 'search=yes, ai-input=yes, ai-train=no') fail('data/markdown-companions.json: wrong Content-Signal policy');

const requiredTools = ['get_company_overview', 'list_services', 'match_project_scope', 'prepare_project_inquiry', 'prepare_rfq_brief', 'list_service_areas', 'get_procurement_profile', 'read_public_resource'];
for (const tool of requiredTools) {
  if (!JSON.stringify(agentCard).includes(tool)) fail(`.well-known/agent-card.json: missing ${tool}`);
  if (!JSON.stringify(mcp).includes(tool)) fail(`.well-known/mcp.json: missing ${tool}`);
  if (!JSON.stringify(mcpServerCard).includes(tool)) fail(`.well-known/mcp/server-card.json: missing ${tool}`);
}

if (!mcp.endpoint?.endsWith('/api/mcp')) fail('.well-known/mcp.json: endpoint must be /api/mcp');
if (!mcpServerCards.servers?.some((server) => server.url?.endsWith('/.well-known/mcp/server-card.json'))) fail('.well-known/mcp/server-cards.json: missing server card URL');
if (!agentSkills.skills?.length) fail('.well-known/agent-skills/index.json: missing skills');
if (openapi.openapi !== '3.1.0') fail('openapi.json: expected OpenAPI 3.1.0');
for (const path of [
  '/data/company.json',
  '/data/services.json',
  '/data/capabilities.json',
  '/data/service-areas.json',
  '/data/project-inquiry-schema.json',
  '/data/agent-routing.json',
  '/data/procurement-profile.json',
  '/data/vendor-onboarding-requirements.json',
  '/data/compliance-profile.json',
  '/data/rfq-preparation.json',
  '/data/ai-visibility-queries.json',
  '/data/analytics-events.json',
  '/data/high-intent-content-plan.json',
  '/data/markdown-companions.json',
  '/api/mcp'
]) {
  if (!openapi.paths?.[path]) fail(`openapi.json: missing ${path}`);
}

const llms = await readRequired('llms.txt');
const llmsFull = await readRequired('llms-full.txt');
const robots = await readRequired('robots.txt');
const webmcp = await readRequired('webmcp.js');
const mcpApi = await readRequired('api/mcp.js');
for (const needle of [
  '/data/company.json',
  '/data/services.json',
  '/data/agent-routing.json',
  '/data/procurement-profile.json',
  '/data/rfq-preparation.json',
  '/data/markdown-companions.json',
  '/api/mcp',
  'prepare_project_inquiry',
  'prepare_rfq_brief',
  'get_procurement_profile'
]) {
  requireIncludes(llms, 'llms.txt', needle, needle);
  requireIncludes(llmsFull, 'llms-full.txt', needle, needle);
}
requireIncludes(llms, 'llms.txt', 'cancelled', 'cancelled high-intent page warning');
requireIncludes(llmsFull, 'llms-full.txt', 'cancelled', 'cancelled high-intent page warning');
requireIncludes(robots, 'robots.txt', 'Disallow: /admin/', 'admin block');
requireIncludes(robots, 'robots.txt', 'Allow: /data/', 'data allow');
requireIncludes(webmcp, 'webmcp.js', 'prepare_project_inquiry', 'safe inquiry tool');
requireIncludes(webmcp, 'webmcp.js', 'approvalRequiredBeforeContact', 'contact approval guard');
requireIncludes(mcpApi, 'api/mcp.js', 'prepare_project_inquiry', 'MCP inquiry tool');
requireIncludes(mcpApi, 'api/mcp.js', 'prepare_rfq_brief', 'MCP RFQ tool');
requireIncludes(mcpApi, 'api/mcp.js', 'get_procurement_profile', 'MCP procurement tool');
requireIncludes(mcpApi, 'api/mcp.js', 'X-Request-Id', 'request ID header');
requireIncludes(mcpApi, 'api/mcp.js', 'ETag', 'resource ETag header');
requireIncludes(mcpApi, 'api/mcp.js', 'mcp_tool_call', 'MCP analytics log');
requireIncludes(mcpApi, 'api/mcp.js', 'markdown-companions', 'MCP Markdown companion resource');
requireIncludes(webmcp, 'webmcp.js', 'markdown-companions', 'WebMCP Markdown companion resource');
if (webmcp.includes('request_quote')) fail('webmcp.js: request_quote should not be exposed');
if (JSON.stringify(agentCard).includes('request_quote')) fail('.well-known/agent-card.json: request_quote should not be exposed');

await stat(join(root, 'CLAUDE.md'));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`a2b verification passed: ${homePages.length} homepages, ${servicePrefixes.length * serviceSlugs.length} service pages, ${sitemapUrlCount} sitemap URLs.`);
