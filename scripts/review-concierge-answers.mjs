import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {answerAgentQuestion} from '../api/_lib/agent-concierge-engine.js';
const review=JSON.parse(await readFile('scripts/fixtures/concierge-review.json'));
const ids=new Set();let markdown='# A2B concierge — owner answer review\n\nThe current service is deterministic and available through HTTP/MCP; it is not an LLM and does not learn automatically. These are synthetic review questions, not customer messages. All proposed answers below are unpublished.\n\nReply using an ID (for example, “A01: use this final answer…”). Approval must be explicit; silence is not approval. Each approved correction will be versioned with your final wording and regression questions, tested through both endpoints, then released. Future LLM use would require a separate model/data/cost decision; changing a knowledge base is not fine-tuning model weights.\n';
for(const item of review.items){
 assert.ok(!ids.has(item.id));ids.add(item.id);
 assert.ok(['pending_owner_review','approved','rejected'].includes(item.status));
 if(item.status==='approved'){assert.ok(item.ownerFinalAnswer?.trim());assert.ok(item.approvalReference?.trim());}
 else assert.equal(item.ownerFinalAnswer,null,'Unapproved wording must not be presented as an owner final answer');
 const current=await answerAgentQuestion(item.question);
 assert.ok(current.commercialBoundary.includes('cannot submit forms'));
 assert.ok(current.evidence.every(url=>url==='https://www.a2b.sa'||url.startsWith('https://www.a2b.sa/')));
 markdown+=`\n## ${item.id} — ${item.question}\n\n**Current response:** ${current.answer}\n\n**Finding:** ${item.issue}\n\n**Proposed answer — pending your review:** ${item.proposedAnswer}\n\n**Status:** ${item.status}\n`;
}
if(process.argv.includes('--write'))await writeFile('docs/CONCIERGE_OWNER_REVIEW.md',markdown);
console.log(`Validated ${ids.size} review cases. No runtime answers changed or model training performed.`);
