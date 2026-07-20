# Search Indexing And Schema Gap Check

Date: 2026-07-01
Company: a2b only

## Findings

- Homepage and localized homepages already had JSON-LD for `LocalBusiness`, `Service`, and `FAQPage`.
- Service pages already had JSON-LD for `Service` and `BreadcrumbList`.
- Home and service-page entity references now explicitly include both `Organization` and `LocalBusiness`.
- Google search results show a2b pages indexed, including the homepage, privacy page, vendors page, careers page, and localized service pages.
- Brave search shows a2b indexed, but also exposes old legacy URLs that currently return 404.
- Live `/vendors` uses `M +966 55 384 6446`; the old landline in Google snippet appears to be stale indexed snippet text, not live page text.
- `robots.txt` includes `Sitemap: https://www.a2b.sa/sitemap.xml` and allows public AI/agent discovery resources.
- Owner confirmed the visible ISO certification claim is valid and should remain published.
- Google Search Console ownership for `https://www.a2b.sa/` is verified under the owner Google account by HTML tag.
- Bing Webmaster Tools contains the `https://www.a2b.sa/` property under the owner Google sign-in path.

## What Changed

- Added explicit `Organization` + `LocalBusiness` JSON-LD typing to the homepages and service-page provider references.
- Added permanent redirects for legacy indexed URLs:
  - `/about-us` -> `/#about`
  - `/cold-storage-logistics-in-saudi-arabia` -> `/services/warehousing`
  - `/customs-clearance-services-in-saudi-arabia` -> `/services/customs-clearance`
  - `/contract-logistics-solutions-in-saudi-arabia` -> `/services/supply-chain`
  - `/types-of-cargo-shipments` -> `/services/fleet-types`
- Cancelled the rejected high-intent page plan in public agent guidance so agents do not cite those slugs as live, planned, approved, pending, or future pages.

## Logged-In Verification Completed

- Google Search Console:
  - Property: `https://www.a2b.sa/`
  - Ownership: auto-verified by HTML tag.
  - Sitemap: `/sitemap.xml`
  - Status: Success
  - Submitted: 2026-03-17
  - Last read: 2026-06-24
  - Discovered pages: 65
  - URL Inspection for `https://www.a2b.sa/vendors`: URL is on Google, page is indexed, served over HTTPS, and indexing was requested again after deployment.
- Bing Webmaster Tools:
  - Property: `https://www.a2b.sa/`
  - Sitemap: `https://www.a2b.sa/sitemap.xml`
  - Status: Success
  - Submitted: 2026-03-13
  - Last crawl: 2026-06-30
  - Discovered URLs: 65
  - Errors: 0
  - Warnings: 0
  - URL Inspection for `https://www.a2b.sa/`: indexed successfully, URL can appear on Bing, no SEO/GEO issues found, 2 markup types found.
  - Manual Bing indexing request for `https://www.a2b.sa/` was submitted successfully.

## Remaining Crawl-Lag Follow-Up

- Recheck Brave after redirects are live and crawled.
- Recheck Google snippets after recrawl to confirm the stale old-phone snippet has disappeared.

## 2026-07-04 Crawl-Lag Recheck

- Public search recheck still found stale old landline text in search-result snippets/cache, especially Brave entity/FAQ surfaces.
- Live source verification passed: `https://www.a2b.sa/` and `https://www.a2b.sa/careers` contain `M +966 55 384 6446` and do not contain the retired landline string.
- Repository verification passed: `npm run verify` confirmed 7 homepages, 35 service pages, and 65 sitemap URLs; the old landline guard remains active in `scripts/verify-site.mjs`.
- Legacy indexed URLs such as `https://a2b.sa/about-us/` and `https://a2b.sa/customs-clearance-services-in-saudi-arabia/` redirect through `www.a2b.sa` to current canonical destinations.
- The live sitemap lists current canonical URLs only and does not list legacy WordPress-era slugs.
- Submitted all 65 sitemap URLs to IndexNow again on 2026-07-04; API response was HTTP 200.
- Conclusion: no live site/code fix is needed for the phone number. Remaining issue is external search-index cache freshness.

## 2026-07-20 IndexNow / Bing Recheck

- Live IndexNow key file is reachable at `https://www.a2b.sa/dabfa5738883df4a66f9ad844188f7aa.txt`.
- All 65 canonical sitemap HTML pages include the IndexNow key meta.
- The current 65 canonical sitemap URLs were submitted to IndexNow using the batch API; API response was HTTP 200.
- Bing Webmaster Tools was checked after switching to the `www.a2b.sa` property:
  - Sitemap: `https://www.a2b.sa/sitemap.xml`
  - Status: Success
  - Submitted: 2026-03-13
  - Last crawl: 2026-07-18
  - URLs discovered: 65
  - IndexNow list showed the 2026-07-20 14:32 self-submitted canonical URL batch.
- Added `X-Robots-Tag: noindex, nofollow` for `/indexnow-submit` and `/indexnow-submit.html` so the operational helper page does not enter the search index.
- Added repeatable command: `npm run indexnow:submit`.
- Use `npm run indexnow:submit -- --dry-run` before real submissions to confirm host, key location, and sitemap URL count.

## Owner Decision

- Owner confirmed the ISO certification claim is valid and publishable. No visible ISO cleanup is needed.

## Rollback

Revert the related commit and redeploy the previous Vercel production deployment.
