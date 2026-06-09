export const config = { matcher: '/' };

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

  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/markdown')) {
    return new Response(null, {
      status: 200,
      headers: {
        'x-middleware-rewrite': new URL('/index.md', request.url).toString(),
        'Vary': 'Accept',
      },
    });
  }
}
