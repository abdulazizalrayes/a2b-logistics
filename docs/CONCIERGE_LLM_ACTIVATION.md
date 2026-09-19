# Concierge LLM — free-only activation

The service combines deterministic rules and the 12 owner-approved answers with an optional Cloudflare Workers AI classifier. On 19 September 2026, all 20 real-provider evaluation cases passed after disabling unnecessary model reasoning and protecting fleet technology questions. Owner authorization to create the dedicated credential and activate free-only inference was received in the current Codex task. Production activation still requires the release and live checks below.

## Behavior

Existing rule matches keep their exact approved answers. For unmatched questions, the optional model may select one eligible approved answer ID. The server returns that registry entry verbatim, never model-written prose. Context-specific A01–A04 and sensitive certification/availability questions retain existing rules. Unknown or mixed intent, invalid output, timeout, missing credentials and provider failure fall back to current behavior.

Input privacy and injection checks run before provider access. Eligible question text and the public approved answers go to Cloudflare; private owner-review records do not. No question content, credentials or provider error bodies are logged by the adapter. This screening is not a guarantee that arbitrary free text contains no personal information.

## Owner correction workflow

Keep new proposals in the private review fixture. Only after owner approval, publish the exact final wording in `data/concierge-approved-answers.json`, advance its version, and run the answer review/tests. The model prompt reads that released registry automatically. This improves the answer library; it does not fine-tune model weights or automatically publish unreviewed answers. New answer IDs also require an explicit routing scope and evaluation cases.

## Activation gate

1. Create a dedicated A2B Workers AI inference credential for account `58215c600a9049d0d99d21bfae18cd64`, with no DNS or other unrelated access. Browser credential creation requires owner confirmation at action time.
2. Store it only as encrypted server-side `A2B_CLOUDFLARE_AI_TOKEN` in the A2B Vercel project. Never use a public frontend environment variable or commit the credential.
3. Set `A2B_CONCIERGE_LLM_ENABLED=true` only in an evaluation environment and run `npm run agent:llm:eval`. All 20 synthetic English/Arabic cases must pass. Invalid JSON and provider unavailability count as failures even for null cases. Evaluate model latency and JSON behavior; the selected Qwen model was evaluated with reasoning disabled using `/no_think`.
4. Run CI and a preview API/MCP smoke check. Then enable in production and redeploy. Verify both interfaces on a novel paraphrase and repeat the 12 approved-answer checks.
5. Keep the account on Workers Free; no paid plan upgrade is authorized. If free inference is unavailable, fall back to deterministic answers.

Rollback: remove/set `A2B_CONCIERGE_LLM_ENABLED=false` and redeploy. The prior deterministic path requires no provider credential. Revoke a compromised credential separately.

Local mocked tests verify contract enforcement, privacy rejection, exact approved text, protected scopes and provider-error fallback. They do not establish real-model accuracy.

## Free-only operating constraint

Workers Free was verified in the Cloudflare dashboard on 19 September 2026. Keep that account on Free: its daily inference allowance stops requests rather than enabling paid overage. The application has no paid-provider fallback, subscription creation or plan-upgrade path. A future account upgrade would invalidate this cost boundary and must not be made for this concierge. Existing Vercel hosting remains unchanged.
