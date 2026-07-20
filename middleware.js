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

function acceptsMarkdown(acceptHeader) {
  if (!acceptHeader) return false;
  return acceptHeader.split(',').some((part) => {
    const [type, ...params] = part.trim().split(';').map((value) => value.trim());
    if (type.toLowerCase() !== 'text/markdown') return false;
    const q = params.find((param) => param.toLowerCase().startsWith('q='));
    return !q || Number.parseFloat(q.slice(2)) > 0;
  });
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
  if (!route || !acceptsMarkdown(request.headers.get('accept') || '')) return undefined;

  return new Response(null, {
    status: 200,
    headers: {
      'x-middleware-rewrite': new URL(route.markdownPath, request.url).toString(),
      ...representationHeaders(route),
    },
  });
}
