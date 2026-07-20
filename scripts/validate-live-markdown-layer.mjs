import { MARKDOWN_ROUTES, CONTENT_SIGNAL } from '../markdown-routes.mjs';

const origin = process.argv[2] || 'https://www.a2b.sa';
const errors = [];
let htmlBytes = 0;
let markdownBytes = 0;

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function header(headers, name) {
  return headers.get(name)?.toLowerCase() || '';
}

async function request(pathname, options = {}) {
  const response = await fetch(`${origin}${pathname}`, {
    redirect: 'manual',
    headers: options.headers || {},
  });
  const body = options.readBody ? await response.arrayBuffer() : null;
  return { response, body };
}

async function validateRoute(pathname, route) {
  const html = await request(pathname, {
    readBody: true,
    headers: { accept: 'text/html,application/xhtml+xml' },
  });
  assert(html.response.status === 200, `${pathname}: HTML status ${html.response.status}`);
  assert(header(html.response.headers, 'content-type').includes('text/html'), `${pathname}: HTML content-type missing`);
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
  assert(markdown.response.headers.get('link') === `<${route.canonical}>; rel="canonical"`, `${pathname}: canonical Link mismatch`);
  assert(markdown.response.headers.get('content-signal') === CONTENT_SIGNAL, `${pathname}: Content-Signal mismatch`);
  markdownBytes += markdown.body?.byteLength || 0;

  const qZero = await request(pathname, {
    readBody: false,
    headers: { accept: 'text/markdown;q=0, text/html' },
  });
  assert(qZero.response.status === 200, `${pathname}: q=0 status ${qZero.response.status}`);
  assert(header(qZero.response.headers, 'content-type').includes('text/html'), `${pathname}: q=0 should return HTML`);

  const sidecar = await request(route.markdownPath, {
    readBody: true,
    headers: { accept: 'text/html,application/xhtml+xml' },
  });
  assert(sidecar.response.status === 200, `${route.markdownPath}: sidecar status ${sidecar.response.status}`);
  assert(header(sidecar.response.headers, 'content-type').includes('text/markdown'), `${route.markdownPath}: sidecar markdown content-type missing`);
  assert(sidecar.response.headers.get('x-robots-tag') === 'noindex, follow', `${route.markdownPath}: sidecar noindex missing`);
  assert(sidecar.response.headers.get('content-location') === route.contentLocation, `${route.markdownPath}: sidecar Content-Location mismatch`);
  assert(sidecar.response.headers.get('content-language') === route.language, `${route.markdownPath}: sidecar Content-Language mismatch`);
  assert(sidecar.response.headers.get('link') === `<${route.canonical}>; rel="canonical"`, `${route.markdownPath}: sidecar canonical Link mismatch`);
  assert(sidecar.response.headers.get('content-signal') === CONTENT_SIGNAL, `${route.markdownPath}: sidecar Content-Signal mismatch`);
}

for (const [pathname, route] of Object.entries(MARKDOWN_ROUTES)) {
  await validateRoute(pathname, route);
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
