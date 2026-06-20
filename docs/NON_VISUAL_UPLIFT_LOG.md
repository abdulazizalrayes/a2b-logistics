# Non-Visual Uplift Log

Date: 2026-06-18
Company: a2b only

## Completed

- Added `CLAUDE.md` project guidance for future coding agents.
- Added `npm run verify` through `scripts/verify-site.mjs`.
- Added analytics events for contact clicks and form submit attempts without changing visible UI or form behavior.
- Added missing `ar-SA` hreflang alternates to non-Arabic homepage and service-page clusters.
- Corrected homepage Service JSON-LD offer catalog URLs so dedicated services point to their canonical service pages.
- Documented the DNS-AID blocker and rollback path in `docs/DNS_AID_BLOCKER.md`.

## Verification Standard

Run:

```sh
npm run verify
```

The verifier checks:

- homepage hreflang clusters
- service-page hreflang clusters
- JSON-LD parseability
- FAQPage, Service, and BreadcrumbList coverage
- GA4 presence
- contact/form analytics event hooks
- sitemap URL floor
- absence of the old landline
- absence of stray U+05AA Arabic corruption marker

## Postponed By Owner

- More dedicated high-intent pages.
- Visual/design/UX uplift.
- Visual conversion-rate optimization changes.

## 2026-06-20 Follow-Up

- Confirmed `npm run verify` still passes: 7 homepages, 35 service pages, 65 sitemap URLs.
- Confirmed live production serves GA4 `G-909SV0D9FM`, `contact_click`, and `form_submit_attempt`.
- Confirmed live sitemap contains 65 URLs.
- Ran Lighthouse against `https://www.a2b.sa/`: Performance 92, Accessibility 92, Best Practices 100, SEO 100, CLS 0.
- Committed and pushed the non-visual uplift to GitHub commit `2e28fb2`.
- Paperclip online recording was attempted, but `https://ai.eijarat.com/NAJ/dashboard` returned Cloudflare 502 at 2026-06-20 08:49 UTC.
