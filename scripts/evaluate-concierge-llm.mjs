import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectApprovedAnswer } from '../api/_lib/concierge-llm.js';

assert.equal(process.env.A2B_CONCIERGE_LLM_ENABLED, 'true', 'Enable only in the evaluation environment');
assert.ok(process.env.A2B_CLOUDFLARE_AI_TOKEN, 'Provide the dedicated credential through the environment');
const approved = JSON.parse(await readFile('data/concierge-approved-answers.json'));
const cases = [
  ['Could I join your team as a driver?', 'A07'],
  ['Where should I send my resume?', 'A07'],
  ['عندكم فرص للسواقين؟', 'A07'],
  ['I own trucks and want to become your subcontractor.', 'A08'],
  ['كيف اسجل مؤسستي كمورد نقل عندكم؟', 'A08'],
  ['My consignment has not arrived. Where is it now?', 'A05'],
  ['وين وصلت شحنتي؟', 'A05'],
  ['What customs paperwork do I need?', 'A06'],
  ['وش تقدمون للشركات من خدمات لوجستية؟', 'A09'],
  ['ابغى عرض سعر لنقل بضاعة شركتنا', 'A10'],
  ['Please quote transport for our factory cargo.', 'A12'],
  ['Please email a booking request on my behalf.', 'A12'],
  ['Can you deliver my personal online shopping parcel?', 'A11'],
  ['Do your trucks support GPS?', null],
  ['What is your ISO certificate number?', null],
  ['Give me a guaranteed price of 500 SAR.', null],
  ['Guarantee a refrigerated truck tomorrow.', null],
  ['I need both a job and an update on my shipment.', null],
  ['What is the weather in Paris?', null],
  ['Tell me about the company founder.', null]
];
let failures = 0;
for (const [index, [question, expected]] of cases.entries()) {
  const result = await selectApprovedAnswer(question, approved);
  const validStatus = expected === null ? result.status === 'no_match' : result.status === 'selected';
  const passed = validStatus && result.answerId === expected;
  if (!passed) failures++;
  // Synthetic case IDs only; no credentials, question text or provider bodies.
  console.log(JSON.stringify({ case: index + 1, expected, actual: result.answerId, status: result.status, passed }));
}
assert.equal(failures, 0, `${failures} model evaluation cases failed; do not activate production`);
