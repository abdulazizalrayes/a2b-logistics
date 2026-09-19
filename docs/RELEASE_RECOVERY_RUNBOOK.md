# A2B release and recovery

Company: a2b. Repository: abdulazizalrayes/a2b-logistics. Production: https://www.a2b.sa. Vercel project: a2b-logistics, prj_rmDHwzUxoJjVwZOXaK1HPR1M9k7N.

## Release gate

Use an isolated checkout. Preserve the owner's existing dirty checkout. Run npm ci, npm run markdown:generate, npm run verify, npm run quality:check, npm run test:whatsapp, npm run agent:concierge:test, npm run health:test, npm run agent:metrics:test, npm run agent:answers:check, npm run architecture:check and npm audit --audit-level=high. Commit generated Markdown and architecture output. Run npm run markdown:validate from the clean commit. PR CI and CodeQL must pass before merging.

The production workflow waits for the exact commit's Vercel status and compares all 65 canonical HTML responses with the checkout, then verifies private URLs return 404 and checks seven public health paths. Only Cloudflare’s specifically identified edge-injected beacon tag is excluded from HTML comparison; all other parsed HTML content and public CSS/JS assets must match. Response bodies are compared in memory; only status and match outcomes are retained. Verification requests are synthetic and must not be counted as enquiries. GitHub artifact retention is 30 days. Review the Vercel Production/Current alias and source SHA during closeout; the workflow supplements that provider check.

## Recovery triggers

A customer-critical navigation/form regression, broken language routing, failed security boundary, incorrect content or persistent API failure warrants recovery. A mismatch caused by a newer production release requires checking deployment identity rather than reverting healthy newer code. Never change DNS or credentials as a generic recovery step.

## Executable recovery

1. Read current main and the current Vercel production deployment. Confirm there are no newer owner changes that would be overwritten.
2. Create a fresh codex/ recovery branch from current main in an isolated worktree.
3. Revert the specific offending merged commit with `git revert <verified-offending-commit>`. Do not reset or force-push shared history. For the experience release, retain the earlier security fix.
4. Run the applicable checks above, open and attach a PR, merge after CI, and verify the canonical domain. In a confirmed outage, Vercel rollback to the verified prior deployment can be used under incident authority, then reconcile Git history; do not use a guessed deployment ID.
5. Run `npm run release:verify` from the recovered checkout and inspect the production alias/source. Record trigger, before/after SHAs, timestamps, health and remaining risk. Do not claim recovery based on a push alone.

## Rehearsal, 19 September 2026

Security-preserving recovery baseline: 3b8644f5bba469c5c241401cef2a3cc4527127d1 (before the experience release). Reconstructed in /tmp/a2b-recovery-check-20260919. Locked dependencies installed; site/security and architecture checks passed. Markdown validation initially required generation of the ignored .markdown mirror; include markdown:generate in a clean-checkout recovery. Regenerated mirrors, validated all 65 routes and ran concierge safeguards. No production rollback was performed or claimed.

Owner answer review is separate from release approval. Draft concierge text in docs/CONCIERGE_OWNER_REVIEW.md is not live knowledge. Record the owner's final text and an approval reference before implementing any answer changes, then add paraphrase, boundary and both-endpoint regression checks. No automatic learning from requests, no confidential customer logs in a training set, and no LLM weights are trained by this workflow.

Revert rehearsal: applied `git revert --no-commit 89f2d12825825b239348632d1d45e4d096c7e6af` in a separate disposable checkout. The resulting staged tree exactly matched baseline 3b8644f (tree a21f438260e44622b6b98c26f9279bf2de8eba4a). No production state changed.

## Asset cache versions

Cloudflare currently allows browsers to cache CSS/JS for four hours. Every local CSS/JS reference carries `?v=` with the first 12 hex characters of the file SHA-256. When editing an asset, update its version in all HTML references; `quality:check` rejects missing or stale versions. This makes returning browsers request the new content immediately.
