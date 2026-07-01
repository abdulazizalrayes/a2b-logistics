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

## What Changed

- Added explicit `Organization` + `LocalBusiness` JSON-LD typing to the homepages and service-page provider references.
- Added permanent redirects for legacy indexed URLs:
  - `/about-us` -> `/#about`
  - `/cold-storage-logistics-in-saudi-arabia` -> `/services/warehousing`
  - `/customs-clearance-services-in-saudi-arabia` -> `/services/customs-clearance`
  - `/contract-logistics-solutions-in-saudi-arabia` -> `/services/supply-chain`
  - `/types-of-cargo-shipments` -> `/services/fleet-types`
- Cancelled the rejected high-intent page plan in public agent guidance so agents do not cite those slugs as live, planned, approved, pending, or future pages.

## Verification Needed In Logged-In Tools

These cannot be proven from the public fetch alone:

- Google Search Console: confirm `https://www.a2b.sa/sitemap.xml` is submitted and shows successful fetch/discovery.
- Bing Webmaster Tools: confirm `https://www.a2b.sa/sitemap.xml` is submitted and accepted.
- Request recrawl in Google for `/vendors` after deployment so stale old-phone snippet is refreshed.
- Recheck Brave after redirects are live and crawled.

## Owner Decision Needed

- The site visibly contains ISO certification claims. This pass did not remove them because that would be a visible content change. Owner should confirm the certificates are valid and publishable, or approve visible cleanup in a separate visual/content change.

## Rollback

Revert the related commit and redeploy the previous Vercel production deployment.
