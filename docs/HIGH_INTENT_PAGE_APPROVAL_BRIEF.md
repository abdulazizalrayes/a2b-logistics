# High-Intent Page Approval Brief

Date: 2026-06-29
Company: a2b only

## Purpose

Prepare advanced SEO/AEO/GEO expansion pages without publishing visible website changes before owner approval.

The draft page list is in `/data/high-intent-content-plan.json`.

## No-Visual-Change Rule

No new visible page, navigation change, sitemap addition, internal-link change, layout change, or visual template change should be published until the owner approves the page template and content direction.

## Draft Pages Awaiting Approval

- `/services/flatbed-trucking-riyadh`
- `/services/lowbed-transport-saudi-arabia`
- `/services/customs-clearance-riyadh`
- `/services/warehousing-riyadh`
- `/services/port-to-site-logistics-saudi-arabia`
- `/services/gcc-cross-border-freight`
- `/services/project-logistics-saudi-arabia`

## Recommended Template Direction

Use the existing service-page layout with no redesign:

- same header
- same typography
- same footer
- same CTA style
- same section style
- same responsive behavior

Only page-specific copy, title, meta description, canonical URL, JSON-LD, and FAQ content should change.

## Approval Review Checklist

Before publishing, owner should review:

- exact page list
- page titles and descriptions
- whether each service is genuinely offered or should be framed as coordination/support
- no invented fleet counts, certifications, guarantees, or prices
- no new visual design
- no navigation addition unless approved
- sitemap addition timing

## Rollout Sequence After Approval

1. Create pages from existing service-page template.
2. Add canonical and hreflang if localized later.
3. Add Service + FAQPage + BreadcrumbList JSON-LD.
4. Add to sitemap.
5. Run `npm run verify`.
6. Deploy to Vercel.
7. Request indexing in Search Console.
8. Record rollout and rollback in Paperclip.

## Rollback

Revert the page-addition commit and redeploy previous production deployment.
