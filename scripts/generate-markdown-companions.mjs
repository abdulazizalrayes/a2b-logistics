import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import * as parse5 from 'parse5';

const root = process.cwd();
const ORIGIN = 'https://www.a2b.sa';
const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=no';
const MARKDOWN_PROFILE_VERSION = '1.1.0';
const MARKDOWN_DIR = '.markdown';
const ROUTES_FILE = 'markdown-routes.mjs';
const MANIFEST_FILE = 'data/markdown-companions.json';

const check = process.argv.includes('--check');

const generated = [];
let changed = false;

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function getAttrs(node) {
  return Object.fromEntries((node.attrs || []).map((attr) => [attr.name, attr.value]));
}

function attr(node, name) {
  return getAttrs(node)[name] || '';
}

function children(node) {
  return node.childNodes || [];
}

function textContent(node) {
  if (!node) return '';
  if (node.nodeName === '#text') return node.value || '';
  return children(node).map(textContent).join('');
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isDecorativeText(value) {
  const text = normalizeText(value);
  if (!text) return true;
  return text.length <= 3 && !/[\p{L}\p{N}]/u.test(text);
}

function findNode(node, predicate) {
  if (predicate(node)) return node;
  for (const child of children(node)) {
    const found = findNode(child, predicate);
    if (found) return found;
  }
  return null;
}

function findAll(node, predicate, results = []) {
  if (predicate(node)) results.push(node);
  for (const child of children(node)) findAll(child, predicate, results);
  return results;
}

function hasClass(node, className) {
  return attr(node, 'class').split(/\s+/).includes(className);
}

function isHidden(node) {
  if (!node || !node.attrs) return false;
  const attrs = getAttrs(node);
  const style = attrs.style || '';
  return (
    Object.prototype.hasOwnProperty.call(attrs, 'hidden') ||
    attrs['aria-hidden'] === 'true' ||
    /display\s*:\s*none/i.test(style) ||
    /visibility\s*:\s*hidden/i.test(style)
  );
}

function shouldSkip(node) {
  if (!node || node.nodeName === '#comment' || isHidden(node)) return true;
  const name = node.tagName || node.nodeName;
  if (['nav', 'footer', 'form', 'script', 'style', 'noscript', 'template', 'svg', 'button', 'input', 'select', 'textarea', 'label'].includes(name)) {
    return true;
  }
  if (hasClass(node, 'mobile-menu') || attr(node, 'id') === 'mobileMenu') return true;
  if (attr(node, 'id') === 'navbar') return true;
  return false;
}

function escapeMarkdown(value) {
  return value.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function escapeTable(value) {
  return normalizeText(value).replace(/\|/g, '\\|');
}

function absoluteUrl(href, canonicalUrl) {
  if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
  try {
    return new URL(href, canonicalUrl).toString();
  } catch {
    return href;
  }
}

function block(lines, value = '') {
  const trimmed = value.trim();
  if (!trimmed || isDecorativeText(trimmed)) return;
  if (lines.length && lines[lines.length - 1] !== '') lines.push('');
  lines.push(trimmed);
}

function inlineMarkdown(node, canonicalUrl) {
  if (!node) return '';
  if (node.nodeName === '#text') return normalizeText(node.value || '');
  if (shouldSkip(node)) return '';

  const name = node.tagName || node.nodeName;
  if (name === 'br') return '\n';
  if (name === 'img') {
    const alt = normalizeText(attr(node, 'alt'));
    if (!alt) return '';
    const src = absoluteUrl(attr(node, 'src'), canonicalUrl);
    return src ? `![${escapeMarkdown(alt)}](${src})` : alt;
  }

  const inner = normalizeText(children(node).map((child) => inlineMarkdown(child, canonicalUrl)).filter(Boolean).join(' '));
  if (!inner) return '';

  if (name === 'a') {
    const href = absoluteUrl(attr(node, 'href'), canonicalUrl);
    return href ? `[${escapeMarkdown(inner)}](${href})` : inner;
  }
  if (['strong', 'b'].includes(name)) return `**${inner}**`;
  if (['em', 'i'].includes(name)) return `_${inner}_`;
  if (name === 'code') return `\`${inner.replace(/`/g, '\\`')}\``;
  return inner;
}

function renderTable(node, lines, canonicalUrl) {
  const rows = findAll(node, (candidate) => candidate.tagName === 'tr')
    .map((row) => children(row).filter((cell) => ['td', 'th'].includes(cell.tagName)).map((cell) => escapeTable(inlineMarkdown(cell, canonicalUrl))))
    .filter((row) => row.length);
  if (!rows.length) return;
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill('')]);
  if (lines.length && lines[lines.length - 1] !== '') lines.push('');
  lines.push(`| ${normalized[0].join(' | ')} |`);
  lines.push(`| ${Array(width).fill('---').join(' | ')} |`);
  for (const row of normalized.slice(1)) lines.push(`| ${row.join(' | ')} |`);
}

function traversePublicContent(node, callback) {
  if (!node || shouldSkip(node)) return;
  callback(node);
  for (const child of children(node)) traversePublicContent(child, callback);
}

function uniqueBy(items, keyForItem) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyForItem(item);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function extractPublicLinks(rootNode, canonicalUrl) {
  const links = [];
  traversePublicContent(rootNode, (node) => {
    if (node.tagName !== 'a') return;
    const rawHref = attr(node, 'href');
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
    const label = normalizeText(textContent(node));
    const href = absoluteUrl(rawHref, canonicalUrl);
    if (!href || !label) return;
    links.push({ label, href });
  });
  return uniqueBy(links, (link) => `${link.label}\u0000${link.href}`);
}

function extractPublicImages(rootNode, canonicalUrl) {
  const images = [];
  traversePublicContent(rootNode, (node) => {
    if (node.tagName !== 'img') return;
    const alt = normalizeText(attr(node, 'alt'));
    if (!alt) return;
    const src = absoluteUrl(attr(node, 'src'), canonicalUrl);
    if (!src) return;
    images.push({ alt, src });
  });
  return uniqueBy(images, (image) => `${image.alt}\u0000${image.src}`);
}

function extractAlternates(document) {
  return findAll(document, (node) => node.tagName === 'link' && attr(node, 'rel') === 'alternate' && attr(node, 'hreflang') && attr(node, 'href'))
    .map((node) => ({ hreflang: attr(node, 'hreflang'), href: attr(node, 'href') }));
}

function classifyPage(meta) {
  const pathname = new URL(meta.canonical).pathname;
  if (pathname === '/') return 'homepage';
  if (/^\/(?:ar|de|it|es|fr|zh-Hans)$/.test(pathname)) return 'localized_homepage';
  if (pathname.includes('/services/')) return 'service';
  if (pathname.endsWith('/fleet') || pathname === '/fleet') return 'fleet';
  if (pathname.endsWith('/careers') || pathname === '/careers') return 'careers';
  if (pathname.endsWith('/vendors') || pathname === '/vendors') return 'vendors';
  if (pathname.includes('privacy') || pathname.includes('terms')) return 'policy';
  return 'page';
}

function renderNode(node, lines, canonicalUrl, listDepth = 0) {
  if (!node || shouldSkip(node)) return;
  if (node.nodeName === '#text') {
    block(lines, normalizeText(node.value || ''));
    return;
  }

  const name = node.tagName || node.nodeName;
  if (/^h[1-6]$/.test(name)) {
    const level = Number(name.slice(1));
    block(lines, `${'#'.repeat(level)} ${inlineMarkdown(node, canonicalUrl)}`);
    return;
  }
  if (name === 'p') {
    block(lines, inlineMarkdown(node, canonicalUrl));
    return;
  }
  if (name === 'img') {
    block(lines, inlineMarkdown(node, canonicalUrl));
    return;
  }
  if (name === 'a') {
    block(lines, inlineMarkdown(node, canonicalUrl));
    return;
  }
  if (name === 'ul' || name === 'ol') {
    const items = children(node).filter((child) => child.tagName === 'li');
    if (lines.length && lines[lines.length - 1] !== '') lines.push('');
    items.forEach((item, index) => {
      const marker = name === 'ol' ? `${index + 1}.` : '-';
      const text = inlineMarkdown(item, canonicalUrl);
      if (text) lines.push(`${'  '.repeat(listDepth)}${marker} ${text}`);
      for (const child of children(item).filter((child) => ['ul', 'ol'].includes(child.tagName))) {
        renderNode(child, lines, canonicalUrl, listDepth + 1);
      }
    });
    return;
  }
  if (name === 'table') {
    renderTable(node, lines, canonicalUrl);
    return;
  }
  if (name === 'details') {
    const summary = findNode(node, (candidate) => candidate.tagName === 'summary');
    block(lines, `### ${inlineMarkdown(summary, canonicalUrl) || 'Details'}`);
    for (const child of children(node)) {
      if (child.tagName !== 'summary') renderNode(child, lines, canonicalUrl, listDepth);
    }
    return;
  }
  if (['section', 'article', 'main', 'aside', 'div', 'header'].includes(name) || node.nodeName === '#document' || name === 'body') {
    for (const child of children(node)) renderNode(child, lines, canonicalUrl, listDepth);
  }
}

function metadata(document, file) {
  const html = findNode(document, (node) => node.tagName === 'html');
  const title = normalizeText(textContent(findNode(document, (node) => node.tagName === 'title')));
  const description = attr(findNode(document, (node) => node.tagName === 'meta' && attr(node, 'name') === 'description'), 'content');
  const canonical = attr(findNode(document, (node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical'), 'href');
  const language = attr(html, 'lang') || attr(findNode(document, (node) => node.tagName === 'meta' && attr(node, 'name') === 'language'), 'content') || 'en';

  if (!title) fail(`${file}: missing title`);
  if (!description) fail(`${file}: missing description`);
  if (!canonical) fail(`${file}: missing canonical`);

  return { title, description, canonical, language };
}

function extractJsonLd(document, file) {
  const blocks = findAll(document, (node) => node.tagName === 'script' && attr(node, 'type') === 'application/ld+json');
  return blocks.map((node, index) => {
    const raw = textContent(node).trim();
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch (error) {
      fail(`${file}: JSON-LD block ${index + 1} is invalid: ${error.message}`);
      return '';
    }
  }).filter(Boolean);
}

function routePathFromUrl(url) {
  const parsed = new URL(url);
  return parsed.pathname === '/' ? '/' : parsed.pathname.replace(/\/$/, '');
}

function htmlFileForRoute(routePath) {
  if (routePath === '/') return 'index.html';
  const clean = routePath.replace(/^\//, '');
  const indexFile = join(clean, 'index.html');
  return indexFile;
}

async function fileExists(file) {
  try {
    await stat(join(root, file));
    return true;
  } catch {
    return false;
  }
}

async function htmlFileForUrl(url) {
  const routePath = routePathFromUrl(url);
  const indexFile = htmlFileForRoute(routePath);
  if (await fileExists(indexFile)) return indexFile;
  const flatFile = `${routePath.replace(/^\//, '')}.html`;
  if (await fileExists(flatFile)) return flatFile;
  return null;
}

function sidecarForRoute(routePath) {
  if (routePath === '/') return 'index.md';
  return `${routePath.replace(/^\//, '')}.md`;
}

function contentLocationForRoute(routePath) {
  return `${ORIGIN}${routePath === '/' ? '/index.md' : `${routePath}.md`}`;
}

async function readSitemapUrls() {
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function frontMatter({ title, description, canonical, language, sourceFile }) {
  return [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `canonical: ${JSON.stringify(canonical)}`,
    `language: ${JSON.stringify(language)}`,
    `page_type: ${JSON.stringify(classifyPage({ canonical }))}`,
    `source_html: ${JSON.stringify(sourceFile)}`,
    `markdown_profile_version: ${JSON.stringify(MARKDOWN_PROFILE_VERSION)}`,
    `content_signal: ${JSON.stringify(CONTENT_SIGNAL)}`,
    'robots: "noindex, follow"',
    '---',
    '',
  ];
}

function markdownForHtml(html, sourceFile) {
  const document = parse5.parse(html, { sourceCodeLocationInfo: false });
  const meta = metadata(document, sourceFile);
  const canonicalUrl = meta.canonical;
  const body = findNode(document, (node) => node.tagName === 'body');
  const lines = frontMatter({ ...meta, sourceFile });
  const alternates = extractAlternates(document);

  lines.push(`# ${meta.title}`, '');
  lines.push(`> ${meta.description}`, '');
  lines.push('## Agent Metadata', '');
  lines.push(`- Canonical URL: ${meta.canonical}`);
  lines.push(`- Language: ${meta.language}`);
  lines.push(`- Page type: ${classifyPage(meta)}`);
  lines.push(`- Source HTML: ${sourceFile}`);
  lines.push(`- Markdown profile: ${MARKDOWN_PROFILE_VERSION}`);
  lines.push(`- Content-Signal: ${CONTENT_SIGNAL}`);
  lines.push('- Search indexing: canonical HTML is indexable; direct Markdown sidecar is noindex, follow.');
  lines.push('- Preferred agent access: send `Accept: text/markdown` to the canonical URL.');

  if (alternates.length) {
    lines.push('', '## Alternate Language Pages', '');
    for (const alternate of alternates) {
      lines.push(`- ${alternate.hreflang}: ${alternate.href}`);
    }
  }

  lines.push('', '## Main Content', '');

  const contentLines = [];
  renderNode(body, contentLines, canonicalUrl);
  lines.push(...dedupeBlankLines(contentLines));

  const publicLinks = extractPublicLinks(body, canonicalUrl);
  if (publicLinks.length) {
    lines.push('', '## Extracted Public Links', '');
    for (const link of publicLinks) {
      lines.push(`- [${escapeMarkdown(link.label)}](${link.href})`);
    }
  }

  const publicImages = extractPublicImages(body, canonicalUrl);
  if (publicImages.length) {
    lines.push('', '## Extracted Public Images', '');
    for (const image of publicImages) {
      lines.push(`- ![${escapeMarkdown(image.alt)}](${image.src})`);
    }
  }

  const jsonLd = extractJsonLd(document, sourceFile);
  if (jsonLd.length) {
    lines.push('', '## Public Structured Data');
    jsonLd.forEach((block, index) => {
      lines.push('', `### JSON-LD ${index + 1}`, '', '```json', block, '```');
    });
  }

  return `${dedupeBlankLines(lines).join('\n').trim()}\n`;
}

function dedupeBlankLines(lines) {
  const out = [];
  for (const line of lines.map((line) => line.trimEnd())) {
    if (line === '' && out[out.length - 1] === '') continue;
    out.push(line);
  }
  return out;
}

async function writeIfChanged(file, content) {
  const full = join(root, file);
  let existing = null;
  try {
    existing = await readFile(full, 'utf8');
  } catch {
    // Missing files are generated.
  }
  if (existing !== content) {
    changed = true;
    if (check) {
      console.error(`${file}: not up to date`);
      return;
    }
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
}

async function cleanMarkdownDirectory() {
  if (!check) await rm(join(root, MARKDOWN_DIR), { recursive: true, force: true });
}

async function removeStaleSidecars(expected) {
  async function walk(dir) {
    let entries = [];
    try {
      entries = await readdir(join(root, dir), { withFileTypes: true });
    } catch {
      return [];
    }
    const files = [];
    for (const entry of entries) {
      const rel = join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.vercel' || entry.name === MARKDOWN_DIR) continue;
      if (entry.isDirectory()) files.push(...await walk(rel));
      if (entry.isFile() && entry.name.endsWith('.md') && !rel.startsWith('docs/') && !rel.startsWith('reports/') && rel !== 'auth.md' && rel !== 'CLAUDE.md') {
        files.push(rel);
      }
    }
    return files;
  }

  const files = await walk('.');
  for (const file of files.map((file) => file.replace(/^\.\//, ''))) {
    if (!expected.has(file) && file !== 'llms.txt' && file !== 'llms-full.txt') {
      changed = true;
      if (check) {
        console.error(`${file}: stale markdown sidecar`);
      } else {
        await rm(join(root, file), { force: true });
      }
    }
  }
}

function routeMapContent(routes) {
  const rows = routes.map((route) => `  ${JSON.stringify(route.route)}: ${JSON.stringify({
    markdownPath: route.markdownPath,
    canonical: route.canonical,
    contentLocation: route.contentLocation,
    language: route.language,
  })}`).join(',\n');
  return `// Generated by scripts/generate-markdown-companions.mjs. Do not edit manually.\nexport const CONTENT_SIGNAL = ${JSON.stringify(CONTENT_SIGNAL)};\nexport const MARKDOWN_ROUTES = {\n${rows}\n};\n`;
}

function manifestContent(routes) {
  return `${JSON.stringify({
    schemaVersion: '1.1.0',
    company: 'a2b Logistics Company',
    canonicalDomain: ORIGIN,
    contentSignal: CONTENT_SIGNAL,
    markdownProfileVersion: MARKDOWN_PROFILE_VERSION,
    companionEnhancements: [
      'agent metadata block',
      'alternate language page inventory',
      'deduplicated public link inventory',
      'deduplicated meaningful-image inventory',
      'public JSON-LD preservation',
      'decorative icon-only text suppression',
    ],
    negotiation: {
      requestHeader: 'Accept: text/markdown',
      supportedMediaRanges: ['text/markdown', 'text/html', 'application/xhtml+xml', 'text/*', '*/*'],
      preferenceRules: [
        'Higher q-value wins.',
        'Equal q-value uses the more specific matching media range.',
        'Equal explicit HTML and Markdown preference defaults to HTML.',
        'Missing, unsupported, wildcard-only, or otherwise ambiguous Accept headers default to HTML.',
        'A representation with q=0 is not selected.',
        'If both HTML and Markdown are explicitly unacceptable with q=0, the response is 406 Not Acceptable.',
      ],
      htmlDiscovery: 'HTML and HTML HEAD responses advertise the page-specific Markdown companion with an absolute alternate Link header.',
      cacheVariation: 'Canonical HTML and Markdown responses include Vary: Accept.',
      fallback: 'HTML is served when Markdown is unavailable, unacceptable, or does not win negotiation.',
      directSidecars: 'Direct .md sidecars are noindex, follow.',
    },
    generatedAtPolicy: 'deterministic-build-time',
    routes: routes.map((route) => ({
      canonical: route.canonical,
      route: route.route,
      markdownPath: route.markdownPath,
      contentLocation: route.contentLocation,
      language: route.language,
    })),
  }, null, 2)}\n`;
}

async function main() {
  await cleanMarkdownDirectory();
  const urls = await readSitemapUrls();
  const sidecars = new Set();
  const routes = [];

  for (const url of urls) {
    const route = routePathFromUrl(url);
    const sourceFile = await htmlFileForUrl(url);
    if (!sourceFile) {
      fail(`${url}: no matching HTML file`);
      continue;
    }

    const html = await readFile(join(root, sourceFile), 'utf8');
    const markdown = markdownForHtml(html, sourceFile);
    const sidecar = sidecarForRoute(route);
    const mirror = join(MARKDOWN_DIR, sidecar);
    sidecars.add(sidecar);
    generated.push({ route, sourceFile, sidecar, mirror });
    await writeIfChanged(sidecar, markdown);
    await writeIfChanged(mirror, markdown);

    const meta = metadata(parse5.parse(html), sourceFile);
    routes.push({
      route,
      markdownPath: `/${sidecar}`,
      canonical: meta.canonical,
      contentLocation: contentLocationForRoute(route),
      language: meta.language,
    });
  }

  await removeStaleSidecars(sidecars);
  await writeIfChanged(ROUTES_FILE, routeMapContent(routes));
  await writeIfChanged(MANIFEST_FILE, manifestContent(routes));

  if (generated.length !== urls.length) fail(`Expected ${urls.length} generated markdown files, generated ${generated.length}`);
  if (check && changed) process.exitCode = 1;
  if (!process.exitCode) {
    console.log(`${check ? 'Checked' : 'Generated'} ${generated.length} Markdown companions.`);
  }
}

await main();
