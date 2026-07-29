import { MARKDOWN_ROUTES, CONTENT_SIGNAL } from '../markdown-routes.mjs';

const origin = process.argv[2] || 'https://www.a2b.sa';
const errors = [];
let htmlBytes = 0;
let markdownBytes = 0;
const REQUEST_TIMEOUT_MS = 10000;

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function header(headers, name) {
  return headers.get(name)?.toLowerCase() || '';
}

function hasCanonicalLink(headers, canonical) {
  return headers.get('link')?.includes(`<${canonical}>; rel="canonical"`) || false;
}

function hasMarkdownAlternate(headers, contentLocation) {
  return headers.get('link')?.includes(`<${contentLocation}>; rel="alternate"; type="text/markdown"`) || false;
}

async function request(pathname, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${origin}${pathname}`, {
        method: options.method || 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          connection: 'close',
          ...(options.headers || {}),
        },
      });
      const body = options.readBody ? await response.arrayBuffer() : null;
      return { response, body };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function validateRoute(pathname, route) {
  const html = await request(pathname, {
    readBody: true,
    headers: { accept: 'text/html,application/xhtml+xml' },
  });
  assert(html.response.status === 200, `${pathname}: HTML status ${html.response.status}`);
  assert(header(html.response.headers, 'content-type').includes('text/html'), `${pathname}: HTML content-type missing`);
  assert(header(html.response.headers, 'vary').includes('accept'), `${pathname}: HTML Vary Accept missing`);
  assert(hasMarkdownAlternate(html.response.headers, route.contentLocation), `${pathname}: HTML Markdown alternate Link missing`);
  assert(html.response.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: HTML Content-Signal mismatch`);
  htmlBytes += html.body?.byteLength || 0;

  const markdown = await request(pathname, {
    readBody: true,
    headers: { accept: 'text/markdown' },
  });
  assert(markdown.response.status === 200, `${pathname}: Markdown status ${markdown.response.status}`);
  assert(header(markdown.response.headers, 'content-type').includes('text/markdown'), `${pathname}: Markdown content-type missing`);
  assert(header(markdown.response.headers, 'vary').includes('accept'), `${pathname}: Vary Accept missing`);
  assert(markdown.response.headers.get('content-location') === route.contentLocation, `${pathname}: Content-Location mismatch`);
  assert(markdown.response.headers.get('content-language') === route.language, `${pathname}: Content-Language mismatch`);
  assert(hasCanonicalLink(markdown.response.headers, route.canonical), `${pathname}: canonical Link mismatch`);
  assert(markdown.response.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: Content-Signal mismatch`);
  markdownBytes += markdown.body?.byteLength || 0;

  const qZero = await request(pathname, {
    readBody: false,
    headers: { accept: 'text/markdown;q=0, text/html' },
  });
  assert(qZero.response.status === 200, `${pathname}: q=0 status ${qZero.response.status}`);
  assert(header(qZero.response.headers, 'content-type').includes('text/html'), `${pathname}: q=0 should return HTML`);

  const htmlHead = await request(pathname, {
    method: 'HEAD',
    headers: { accept: 'text/html' },
  });
  assert(htmlHead.response.status === 200, `${pathname}: HTML HEAD status ${htmlHead.response.status}`);
  assert(header(htmlHead.response.headers, 'content-type').includes('text/html'), `${pathname}: HTML HEAD content-type missing`);
  assert(header(htmlHead.response.headers, 'vary').includes('accept'), `${pathname}: HTML HEAD Vary Accept missing`);
  assert(hasMarkdownAlternate(htmlHead.response.headers, route.contentLocation), `${pathname}: HTML HEAD Markdown alternate Link missing`);
  assert(htmlHead.response.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: HTML HEAD Content-Signal mismatch`);

  const sidecar = await request(route.markdownPath, {
    readBody: true,
    headers: { accept: 'text/html,application/xhtml+xml' },
  });
  assert(sidecar.response.status === 200, `${route.markdownPath}: sidecar status ${sidecar.response.status}`);
  assert(header(sidecar.response.headers, 'content-type').includes('text/markdown'), `${route.markdownPath}: sidecar markdown content-type missing`);
  assert(sidecar.response.headers.get('x-robots-tag') === 'noindex, follow', `${route.markdownPath}: sidecar noindex missing`);
  assert(sidecar.response.headers.get('content-location') === route.contentLocation, `${route.markdownPath}: sidecar Content-Location mismatch`);
  assert(sidecar.response.headers.get('content-language') === route.language, `${route.markdownPath}: sidecar Content-Language mismatch`);
  assert(hasCanonicalLink(sidecar.response.headers, route.canonical), `${route.markdownPath}: sidecar canonical Link mismatch`);
  assert(sidecar.response.headers.get('content-signal') === CONTENT_SIGNAL, `${route.markdownPath}: sidecar Content-Signal mismatch`);
}

async function validateNegotiationMatrix(pathname, route) {
  const cases = [
    ['exact Markdown', 'text/markdown', 'markdown'],
    ['exact HTML', 'text/html', 'html'],
    ['stronger HTML', 'text/markdown;q=0.4, text/html;q=0.9', 'html'],
    ['stronger Markdown', 'text/markdown;q=0.9, text/html;q=0.4', 'markdown'],
    ['equal explicit preference', 'text/markdown;q=0.8, text/html;q=0.8', 'html'],
    ['Markdown q=0 exclusion', 'text/markdown;q=0, text/html', 'html'],
    ['HTML q=0 exclusion', 'text/html;q=0, text/markdown;q=0.4', 'markdown'],
    ['text wildcard', 'text/*', 'html'],
    ['global wildcard', '*/*', 'html'],
    ['more-specific Markdown tie', 'text/*;q=0.8, text/markdown;q=0.8', 'markdown'],
    ['more-specific HTML tie', 'text/*;q=0.8, text/html;q=0.8', 'html'],
  ];

  for (const [label, accept, expected] of cases) {
    const result = await request(pathname, { headers: { accept } });
    const contentType = header(result.response.headers, 'content-type');
    assert(result.response.status === 200, `${pathname}: ${label} status ${result.response.status}`);
    assert(contentType.includes(`text/${expected}`), `${pathname}: ${label} should return ${expected}`);
    if (expected === 'html') {
      assert(hasMarkdownAlternate(result.response.headers, route.contentLocation), `${pathname}: ${label} alternate Link missing`);
    }
  }

  const notAcceptable = await request(pathname, {
    headers: { accept: 'text/markdown;q=0, text/html;q=0' },
  });
  assert(notAcceptable.response.status === 406, `${pathname}: all q=0 should return 406`);
  assert(header(notAcceptable.response.headers, 'vary').includes('accept'), `${pathname}: all q=0 Vary Accept missing`);
  assert(notAcceptable.response.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: all q=0 Content-Signal mismatch`);

  const markdownHead = await request(pathname, {
    method: 'HEAD',
    headers: { accept: 'text/markdown' },
  });
  assert(markdownHead.response.status === 200, `${pathname}: Markdown HEAD status ${markdownHead.response.status}`);
  assert(header(markdownHead.response.headers, 'content-type').includes('text/markdown'), `${pathname}: Markdown HEAD content-type missing`);
  assert(hasCanonicalLink(markdownHead.response.headers, route.canonical), `${pathname}: Markdown HEAD canonical Link missing`);
}

for (const [pathname, route] of Object.entries(MARKDOWN_ROUTES)) {
  await validateRoute(pathname, route);
}

for (const pathname of ['/services/trucking-road-freight', '/ar/services/trucking-road-freight']) {
  await validateNegotiationMatrix(pathname, MARKDOWN_ROUTES[pathname]);
}

const reduction = htmlBytes > 0 ? Math.round((1 - markdownBytes / htmlBytes) * 1000) / 10 : 0;

if (errors.length) {
  console.error(`Live Markdown validation failed for ${origin}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(JSON.stringify({
  origin,
  routes: Object.keys(MARKDOWN_ROUTES).length,
  htmlBytes,
  markdownBytes,
  responseSizeReductionPercent: reduction,
}, null, 2));
