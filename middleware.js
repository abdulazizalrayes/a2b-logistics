import { CONTENT_SIGNAL, MARKDOWN_ROUTES } from './markdown-routes.mjs';

export const config = {
  matcher: [
    '/',
    '/((?!api/|assets/|images/|favicon|apple-touch-icon|robots.txt|sitemap.xml|llms.txt|llms-full.txt|openapi.json|data/|\\.well-known/).*)',
  ],
};

function routePath(pathname) {
  if (pathname === '/' || pathname === '/index') return '/';
  return pathname.replace(/\/$/, '');
}

function markdownSidecarRoute(pathname) {
  if (!pathname.endsWith('.md')) return null;
  const withoutExtension = pathname.slice(0, -3);
  if (withoutExtension === '/index') return '/';
  return routePath(withoutExtension);
}

function parseAccept(acceptHeader) {
  if (!acceptHeader) return [];
  return acceptHeader.split(',').map((part, order) => {
    const [rawType, ...params] = part.trim().split(';').map((value) => value.trim());
    const type = rawType.toLowerCase();
    const qParam = params.find((param) => param.toLowerCase().startsWith('q='));
    const parsedQ = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    const q = Number.isFinite(parsedQ) && parsedQ >= 0 && parsedQ <= 1 ? parsedQ : 0;
    const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2;
    return { type, q, specificity, order };
  }).filter((entry) => entry.type);
}

function preferenceFor(entries, representation) {
  const exactTypes = representation === 'markdown'
    ? new Set(['text/markdown'])
    : new Set(['text/html', 'application/xhtml+xml']);
  const matches = entries.filter((entry) => (
    exactTypes.has(entry.type) ||
    entry.type === 'text/*' ||
    entry.type === '*/*'
  ));
  if (!matches.length) return null;
  return matches.sort((left, right) => (
    right.specificity - left.specificity ||
    right.q - left.q ||
    left.order - right.order
  ))[0];
}

function preferredRepresentation(acceptHeader) {
  const entries = parseAccept(acceptHeader);
  if (!entries.length) return 'html';

  const markdown = preferenceFor(entries, 'markdown');
  const html = preferenceFor(entries, 'html');
  if (!markdown && !html) return 'html';
  if (markdown?.q === 0 && html?.q === 0) return 'not-acceptable';
  if (markdown?.q === 0) return 'html';
  if (html?.q === 0) return 'markdown';
  if (!markdown) return 'html';
  if (!html) return 'markdown';

  if (markdown.q > html.q) return 'markdown';
  if (html.q > markdown.q) return 'html';
  if (markdown.specificity > html.specificity) return 'markdown';
  return 'html';
}

function representationHeaders(route, includeNoindex = false) {
  const headers = {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Vary': 'Accept',
    'Content-Location': route.contentLocation,
    'Content-Language': route.language,
    'Link': `<${route.canonical}>; rel="canonical"`,
    'Content-Signal': CONTENT_SIGNAL,
  };
  if (includeNoindex) headers['X-Robots-Tag'] = 'noindex, follow';
  return headers;
}

function htmlHeaders(route) {
  return {
    'x-middleware-next': '1',
    'Vary': 'Accept',
    'Link': `<${route.contentLocation}>; rel="alternate"; type="text/markdown"`,
    'Content-Signal': CONTENT_SIGNAL,
  };
}

export default function middleware(request) {
  const url = new URL(request.url);
  const languageRoutes = {
    ar: '/ar',
    de: '/de',
    it: '/it',
    es: '/es',
    fr: '/fr',
    'zh-Hans': '/zh-Hans',
    en: '/',
  };

  const legacyLanguage = url.searchParams.get('lang');
  if (Object.prototype.hasOwnProperty.call(languageRoutes, legacyLanguage)) {
    url.pathname = languageRoutes[legacyLanguage];
    url.search = '';
    return Response.redirect(url, 308);
  }

  const sidecarRoute = markdownSidecarRoute(url.pathname);
  if (sidecarRoute && MARKDOWN_ROUTES[sidecarRoute]) {
    return new Response(null, {
      status: 200,
      headers: {
        'x-middleware-next': '1',
        ...representationHeaders(MARKDOWN_ROUTES[sidecarRoute], true),
      },
    });
  }

  const route = MARKDOWN_ROUTES[routePath(url.pathname)];
  if (!route) return undefined;
  const representation = preferredRepresentation(request.headers.get('accept') || '');
  if (representation === 'not-acceptable') {
    return new Response(null, {
      status: 406,
      headers: {
        'Vary': 'Accept',
        'Content-Signal': CONTENT_SIGNAL,
      },
    });
  }
  if (representation !== 'markdown') {
    return new Response(null, {
      status: 200,
      headers: htmlHeaders(route),
    });
  }

  return new Response(null, {
    status: 200,
    headers: {
      'x-middleware-rewrite': new URL(route.markdownPath, request.url).toString(),
      ...representationHeaders(route),
    },
  });
}
