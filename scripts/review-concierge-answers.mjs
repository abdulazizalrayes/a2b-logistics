import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { answerAgentQuestion } from '../api/_lib/agent-concierge-engine.js';
const review = JSON.parse(await readFile('scripts/fixtures/concierge-review.json'));
const published = JSON.parse(await readFile('data/concierge-approved-answers.json'));
const ids = new Set();
let markdown = '# A2B concierge — owner-approved answers\n\nThe service is available through HTTP/MCP and combines deterministic public-fact rules with an optional LLM that selects approved answers. It does not learn or publish corrections automatically. These are synthetic regression questions, not customer messages. Owner approval was received on 19 September 2026. Only approved final wording is eligible for release.\n\nFor every future correction: draft an answer, obtain the owner’s explicit final wording, preserve the approval reference, update the public answer version, run paraphrase and boundary tests through both endpoints, then release and verify. No unreviewed feedback is automatically published or used for model training.\n';
for (const item of review.items) {
  assert.ok(!ids.has(item.id)); ids.add(item.id);
  assert.ok(['pending_owner_review', 'approved', 'rejected'].includes(item.status));
  const live = published.items.find(entry => entry.id === item.id);
  if (item.status === 'approved') {
    assert.ok(item.ownerFinalAnswer?.trim());
    assert.ok(item.approvalReference?.trim());
    assert.equal(live?.answer, item.ownerFinalAnswer, 'Published wording must exactly match owner approval');
    assert.equal(live?.intent, item.proposedIntent);
    assert.equal(live?.question, item.question);
  } else {
    assert.equal(item.ownerFinalAnswer, null);
    assert.equal(live, undefined, 'Unapproved answers must not enter runtime');
  }
  const current = await answerAgentQuestion(item.question);
  assert.ok(current.commercialBoundary.includes('cannot submit forms'));
  assert.ok(current.evidence.every(url => url === 'https://www.a2b.sa' || url.startsWith('https://www.a2b.sa/')));
  if (item.status === 'approved') {
    assert.equal(current.answer, item.ownerFinalAnswer);
    assert.equal(current.approvedAnswerId, item.id);
  }
  markdown += `\n## ${item.id} — ${item.question}\n\n**Owner-approved final answer:**\n\n${item.ownerFinalAnswer ?? '(Awaiting review)'}\n\n**Status:** ${item.status}\n\n**Approval reference:** ${item.approvalReference ?? '(None)'}\n`;
}
assert.equal(new Set(published.items.map(item => item.id)).size, published.items.length);
assert.ok(published.items.every(item => ids.has(item.id)), 'Every public answer needs a review record');
if (process.argv.includes('--write')) await writeFile('docs/CONCIERGE_OWNER_REVIEW.md', markdown);
console.log(`Validated ${ids.size} owner review records and ${published.items.length} approved runtime answers. No model training performed.`);
