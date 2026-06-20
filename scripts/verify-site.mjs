import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const requiredHomeHreflangs = ['en', 'ar', 'ar-SA', 'de', 'it', 'es', 'fr', 'zh-Hans', 'x-default'];
const serviceSlugs = ['trucking-road-freight', 'warehousing', 'customs-clearance', 'supply-chain', 'fleet-types'];
const servicePrefixes = ['', 'ar', 'de', 'it', 'es', 'fr', 'zh-Hans'];
const homePages = ['index.html', 'ar/index.html', 'de/index.html', 'it/index.html', 'es/index.html', 'fr/index.html', 'zh-Hans/index.html'];

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

for (const file of homePages) {
  const html = await readFile(join(root, file), 'utf8');
  requireHreflangs(html, file, requiredHomeHreflangs);
  requireIncludes(html, file, 'application/ld+json', 'JSON-LD');
  requireIncludes(html, file, 'FAQPage', 'FAQPage schema');
  requireIncludes(html, file, 'G-909SV0D9FM', 'GA4 measurement ID');
  extractJsonLd(html, file);
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

await stat(join(root, 'CLAUDE.md'));

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`a2b verification passed: ${homePages.length} homepages, ${servicePrefixes.length * serviceSlugs.length} service pages, ${sitemapUrlCount} sitemap URLs.`);
