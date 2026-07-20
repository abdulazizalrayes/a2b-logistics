# Markdown For Agents Layer

## Scope

This layer gives agents a deterministic Markdown representation of canonical, indexable sitemap pages without changing the visual website.

Company lock:

- Company: a2b Logistics Company
- Short name: a2b
- Domain: `www.a2b.sa`
- Repository: `abdulazizalrayes/a2b-logistics`
- Vercel project: `a2b-logistics`
- Vercel project ID: `prj_rmDHwzUxoJjVwZOXaK1HPR1M9k7N`
- DNS host: DNet nameservers
- Web host: Vercel

Do not copy these account, domain, analytics, or Paperclip details to another company.

## Architecture

- `scripts/generate-markdown-companions.mjs` reads `sitemap.xml`.
- It maps each sitemap URL to its local canonical HTML file.
- It parses HTML with `parse5`, not regex conversion.
- It extracts public main content while skipping navigation, footer, forms, scripts, styles, hidden content, and controls.
- It writes direct `.md` sidecars, `.markdown/` mirrored audit files, `data/markdown-companions.json`, and `markdown-routes.mjs`.
- `middleware.js` serves Markdown from canonical URLs only when `Accept: text/markdown` has `q > 0`.
- Direct `.md` sidecars are served with `X-Robots-Tag: noindex, follow`.

The approved content signal is:

```text
Content-Signal: search=yes, ai-input=yes, ai-train=no
```

## Agent Usage

Request Markdown from the normal canonical URL:

```http
GET /services/warehousing HTTP/2
Host: www.a2b.sa
Accept: text/markdown
```

Ordinary browser requests continue receiving HTML. Requests with `Accept: text/markdown;q=0` fall back to HTML.

Direct sidecars are also available:

```text
https://www.a2b.sa/services/warehousing.md
```

Coverage manifest:

```text
https://www.a2b.sa/data/markdown-companions.json
```

## Validation Commands

```bash
npm run markdown:generate
npm run markdown:check
npm run markdown:validate
npm run verify
vercel build
```

Live checks after deployment:

```bash
curl -sS -I -H 'Accept: text/markdown' https://www.a2b.sa/services/warehousing
curl -sS -I -H 'Accept: text/markdown;q=0, text/html' https://www.a2b.sa/services/warehousing
curl -sS -I https://www.a2b.sa/services/warehousing.md
curl -sS https://www.a2b.sa/data/markdown-companions.json
```

## Rollback

Revert the commit that introduced the Markdown layer and redeploy the previous Vercel production deployment. No DNS, email, visual design, GA4, Search Console, or Cloudflare changes are required for rollback.

## Cost

The implementation uses the existing GitHub and Vercel hosting setup and the free `parse5` package at build time. No paid provider is introduced.
