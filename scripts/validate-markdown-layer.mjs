import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import middleware from '../middleware.js';
import { MARKDOWN_ROUTES, CONTENT_SIGNAL } from '../markdown-routes.mjs';

const root = process.cwd();
const ORIGIN = 'https://www.a2b.sa';
const errors = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function read(file) {
  return readFile(join(root, file), 'utf8');
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function sidecarForPath(pathname) {
  if (pathname === '/') return 'index.md';
  return `${pathname.replace(/^\//, '')}.md`;
}

function parseFrontMatter(markdown, file) {
  if (!markdown.startsWith('---\n')) {
    fail(`${file}: missing YAML front matter`);
    return {};
  }
  const end = markdown.indexOf('\n---', 4);
  if (end === -1) {
    fail(`${file}: unclosed YAML front matter`);
    return {};
  }
  const entries = {};
  for (const line of markdown.slice(4, end).split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    try {
      entries[key] = JSON.parse(value);
    } catch {
      entries[key] = value.replace(/^"|"$/g, '');
    }
  }
  return entries;
}

function request(pathname, accept) {
  return new Request(`${ORIGIN}${pathname}`, { headers: accept ? { accept } : {} });
}

async function validateMiddleware() {
  for (const [pathname, route] of Object.entries(MARKDOWN_ROUTES)) {
    const markdownResponse = middleware(request(pathname, 'text/markdown'));
    assert(markdownResponse instanceof Response, `${pathname}: text/markdown did not produce middleware response`);
    assert(markdownResponse?.headers.get('x-middleware-rewrite') === `${ORIGIN}${route.markdownPath}`, `${pathname}: wrong markdown rewrite`);
    assert(markdownResponse?.headers.get('content-type') === 'text/markdown; charset=utf-8', `${pathname}: missing markdown content type`);
    assert(markdownResponse?.headers.get('vary') === 'Accept', `${pathname}: missing Vary Accept`);
    assert(markdownResponse?.headers.get('content-location') === route.contentLocation, `${pathname}: missing Content-Location`);
    assert(markdownResponse?.headers.get('content-language') === route.language, `${pathname}: missing Content-Language`);
    assert(markdownResponse?.headers.get('link') === `<${route.canonical}>; rel="canonical"`, `${pathname}: missing canonical Link`);
    assert(markdownResponse?.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: wrong Content-Signal`);

    const qZeroResponse = middleware(request(pathname, 'text/markdown;q=0, text/html'));
    assert(qZeroResponse === undefined, `${pathname}: q=0 should fall back to HTML`);

    const htmlResponse = middleware(request(pathname, 'text/html,application/xhtml+xml'));
    assert(htmlResponse === undefined, `${pathname}: HTML Accept should fall back to HTML`);

    const sidecarResponse = middleware(request(route.markdownPath, 'text/html'));
    assert(sidecarResponse instanceof Response, `${route.markdownPath}: direct sidecar should receive headers`);
    assert(sidecarResponse?.headers.get('x-robots-tag') === 'noindex, follow', `${route.markdownPath}: missing noindex follow`);
    assert(sidecarResponse?.headers.get('content-type') === 'text/markdown; charset=utf-8', `${route.markdownPath}: direct sidecar content type missing`);
    assert(sidecarResponse?.headers.get('content-language') === route.language, `${route.markdownPath}: direct sidecar language missing`);
  }

  assert(middleware(request('/not-in-sitemap', 'text/markdown')) === undefined, 'unknown page should fall back to HTML');
}

async function validateCoverage() {
  const urls = sitemapUrls(await read('sitemap.xml'));
  const manifest = JSON.parse(await read('data/markdown-companions.json'));
  assert(urls.length === Object.keys(MARKDOWN_ROUTES).length, `sitemap/route-map count mismatch: ${urls.length} vs ${Object.keys(MARKDOWN_ROUTES).length}`);
  assert(manifest.routes?.length === urls.length, `manifest route count mismatch: ${manifest.routes?.length} vs ${urls.length}`);
  assert(manifest.contentSignal === CONTENT_SIGNAL, 'manifest Content-Signal mismatch');
  for (const url of urls) {
    const pathname = new URL(url).pathname === '/' ? '/' : new URL(url).pathname.replace(/\/$/, '');
    const route = MARKDOWN_ROUTES[pathname];
    assert(route, `${url}: missing route map entry`);
    const sidecar = sidecarForPath(pathname);
    const manifestRoute = manifest.routes.find((entry) => entry.canonical === url);
    assert(manifestRoute?.markdownPath === `/${sidecar}`, `${sidecar}: manifest markdown path mismatch`);
    assert(route?.markdownPath === `/${sidecar}`, `${url}: wrong sidecar path`);
    const markdown = await read(sidecar);
    const mirror = await read(`.markdown/${sidecar}`);
    assert(sha256(markdown) === sha256(mirror), `${sidecar}: .markdown mirror mismatch`);

    const meta = parseFrontMatter(markdown, sidecar);
    assert(meta.canonical === url.replace(/\/$/, pathname === '/' ? '/' : ''), `${sidecar}: canonical front matter mismatch`);
    assert(meta.content_signal === CONTENT_SIGNAL, `${sidecar}: content-signal front matter mismatch`);
    assert(meta.robots === 'noindex, follow', `${sidecar}: robots front matter mismatch`);
    assert(Boolean(meta.title), `${sidecar}: missing title`);
    assert(Boolean(meta.description), `${sidecar}: missing description`);
    assert(Boolean(meta.language), `${sidecar}: missing language`);
    assert(Boolean(meta.page_type), `${sidecar}: missing page_type`);
    assert(meta.markdown_profile_version === manifest.markdownProfileVersion, `${sidecar}: markdown profile version mismatch`);
    assert(markdown.includes('## Agent Metadata'), `${sidecar}: missing agent metadata section`);
    assert(markdown.includes('- Preferred agent access: send `Accept: text/markdown` to the canonical URL.'), `${sidecar}: missing agent access guidance`);
    assert(markdown.includes('## Main Content'), `${sidecar}: missing main content section`);
    assert(markdown.includes('## Alternate Language Pages') || ['privacy-policy.md', 'terms-and-conditions.md'].includes(sidecar), `${sidecar}: missing alternate language section`);
    assert(!/<script|<style|<nav|<footer|<form/i.test(markdown), `${sidecar}: forbidden HTML/control content leaked`);
  }
}

async function validateHtmlHashes() {
  const result = spawnSync('git', ['diff', '--quiet', '--', '*.html'], { cwd: root, encoding: 'utf8' });
  assert(result.status === 0, 'tracked HTML files changed from HEAD');
}

run('npm', ['run', 'markdown:check']);
await validateCoverage();
await validateMiddleware();
await validateHtmlHashes();

if (errors.length) {
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Markdown layer validation passed: ${Object.keys(MARKDOWN_ROUTES).length} routes covered.`);
