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

function request(pathname, accept, method = 'GET') {
  return new Request(`${ORIGIN}${pathname}`, {
    method,
    headers: accept ? { accept } : {},
  });
}

function assertMarkdownResponse(response, pathname, route, label) {
  assert(response instanceof Response, `${pathname}: ${label} did not produce middleware response`);
  assert(response?.headers.get('x-middleware-rewrite') === `${ORIGIN}${route.markdownPath}`, `${pathname}: ${label} wrong markdown rewrite`);
  assert(response?.headers.get('content-type') === 'text/markdown; charset=utf-8', `${pathname}: ${label} missing markdown content type`);
  assert(response?.headers.get('vary') === 'Accept', `${pathname}: ${label} missing Vary Accept`);
  assert(response?.headers.get('content-location') === route.contentLocation, `${pathname}: ${label} missing Content-Location`);
  assert(response?.headers.get('content-language') === route.language, `${pathname}: ${label} missing Content-Language`);
  assert(response?.headers.get('link') === `<${route.canonical}>; rel="canonical"`, `${pathname}: ${label} missing canonical Link`);
  assert(response?.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: ${label} wrong Content-Signal`);
}

function assertHtmlResponse(response, pathname, route, label) {
  assert(response instanceof Response, `${pathname}: ${label} did not produce middleware response`);
  assert(response?.headers.get('x-middleware-next') === '1', `${pathname}: ${label} should continue to HTML`);
  assert(response?.headers.get('x-middleware-rewrite') === null, `${pathname}: ${label} should not rewrite`);
  assert(response?.headers.get('vary') === 'Accept', `${pathname}: ${label} missing Vary Accept`);
  assert(
    response?.headers.get('link') === `<${route.contentLocation}>; rel="alternate"; type="text/markdown"`,
    `${pathname}: ${label} missing page-specific Markdown alternate Link`,
  );
  assert(response?.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: ${label} wrong Content-Signal`);
}

async function validateMiddleware() {
  for (const [pathname, route] of Object.entries(MARKDOWN_ROUTES)) {
    assertMarkdownResponse(middleware(request(pathname, 'text/markdown')), pathname, route, 'exact Markdown');
    assertMarkdownResponse(
      middleware(request(pathname, 'text/markdown;q=0.9, text/html;q=0.4')),
      pathname,
      route,
      'stronger Markdown q-value',
    );
    assertMarkdownResponse(
      middleware(request(pathname, 'text/*;q=0.8, text/markdown;q=0.8')),
      pathname,
      route,
      'more-specific Markdown tie',
    );
    assertMarkdownResponse(
      middleware(request(pathname, 'text/html;q=0, text/markdown;q=0.4')),
      pathname,
      route,
      'HTML q=0 exclusion',
    );

    assertHtmlResponse(middleware(request(pathname)), pathname, route, 'missing Accept');
    assertHtmlResponse(middleware(request(pathname, 'text/html')), pathname, route, 'exact HTML');
    assertHtmlResponse(
      middleware(request(pathname, 'text/markdown;q=0.4, text/html;q=0.9')),
      pathname,
      route,
      'stronger HTML q-value',
    );
    assertHtmlResponse(
      middleware(request(pathname, 'text/markdown;q=0.8, text/html;q=0.8')),
      pathname,
      route,
      'equal explicit preference',
    );
    assertHtmlResponse(
      middleware(request(pathname, 'text/markdown;q=0, text/html')),
      pathname,
      route,
      'Markdown q=0 exclusion',
    );
    assertHtmlResponse(middleware(request(pathname, 'text/*')), pathname, route, 'text wildcard');
    assertHtmlResponse(middleware(request(pathname, '*/*')), pathname, route, 'global wildcard');
    assertHtmlResponse(
      middleware(request(pathname, 'text/*;q=0.8, text/html;q=0.8')),
      pathname,
      route,
      'more-specific HTML tie',
    );

    const notAcceptableResponse = middleware(request(pathname, 'text/markdown;q=0, text/html;q=0'));
    assert(notAcceptableResponse instanceof Response, `${pathname}: all q=0 did not produce middleware response`);
    assert(notAcceptableResponse?.status === 406, `${pathname}: all q=0 should return 406`);
    assert(notAcceptableResponse?.headers.get('vary') === 'Accept', `${pathname}: all q=0 missing Vary Accept`);
    assert(notAcceptableResponse?.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: all q=0 wrong Content-Signal`);

    assertHtmlResponse(
      middleware(request(pathname, 'text/html', 'HEAD')),
      pathname,
      route,
      'HTML HEAD',
    );
    assertMarkdownResponse(
      middleware(request(pathname, 'text/markdown', 'HEAD')),
      pathname,
      route,
      'Markdown HEAD',
    );

    const sidecarResponse = middleware(request(route.markdownPath, 'text/html'));
    assert(sidecarResponse instanceof Response, `${route.markdownPath}: direct sidecar should receive headers`);
    assert(sidecarResponse?.headers.get('x-robots-tag') === 'noindex, follow', `${route.markdownPath}: missing noindex follow`);
    assert(sidecarResponse?.headers.get('content-type') === 'text/markdown; charset=utf-8', `${route.markdownPath}: direct sidecar content type missing`);
    assert(sidecarResponse?.headers.get('content-language') === route.language, `${route.markdownPath}: direct sidecar language missing`);

    const sidecarHeadResponse = middleware(request(route.markdownPath, 'text/html', 'HEAD'));
    assert(sidecarHeadResponse instanceof Response, `${route.markdownPath}: direct sidecar HEAD should receive headers`);
    assert(sidecarHeadResponse?.headers.get('x-robots-tag') === 'noindex, follow', `${route.markdownPath}: direct sidecar HEAD noindex missing`);
    assert(sidecarHeadResponse?.headers.get('content-type') === 'text/markdown; charset=utf-8', `${route.markdownPath}: direct sidecar HEAD content type missing`);
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
  const result = spawnSync('git', ['diff', '--name-only', '--', '*.html'], { cwd: root, encoding: 'utf8' });
  const changedHtml = result.stdout.trim().split('\n').filter(Boolean);
  const allowedGeneratedHtml = new Set([
    'indexnow-submit.html',
    'docs/architecture/a2b-architecture-map.html',
  ]);
  const unexpectedHtml = changedHtml.filter((file) => !allowedGeneratedHtml.has(file));
  assert(unexpectedHtml.length === 0, `tracked customer-facing HTML files changed from HEAD: ${unexpectedHtml.join(', ')}`);
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
