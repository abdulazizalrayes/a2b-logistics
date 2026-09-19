import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import concierge from '../api/agent-concierge.js';
import mcp from '../api/mcp.js';
import { answerAgentQuestion } from '../api/_lib/agent-concierge-engine.js';
const review = JSON.parse(await readFile('scripts/fixtures/concierge-review.json'));
const approved = review.items.filter(item => item.status === 'approved');
const live = process.argv.includes('--live');
let requestNumber = 0;
async function ask(endpoint, question) {
  const body = endpoint === 'concierge'
    ? { question, language: /[\u0600-\u06ff]/.test(question) ? 'ar' : 'en', agent: 'a2b-approved-answer-synthetic-check' }
    : { jsonrpc: '2.0', id: ++requestNumber, method: 'tools/call', params: { name: 'ask_agent_concierge', arguments: { question } } };
  let result;
  if (live) {
    const response = await fetch(`https://www.a2b.sa/api/${endpoint === 'concierge' ? 'agent-concierge' : 'mcp'}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'A2B-Approved-Answer-Synthetic-Check/1.0' },
      body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(15000)
    });
    assert.equal(response.status, 200, `${endpoint} status`);
    result = await response.json();
  } else {
    const res = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; }, end() {} };
    await (endpoint === 'concierge' ? concierge : mcp)({ method: 'POST', body, headers: { host: 'www.a2b.sa', 'content-type': 'application/json', 'cf-connecting-ip': `192.0.2.${++requestNumber}` } }, res);
    assert.equal(res.statusCode, 200);
    result = res.body;
  }
  return endpoint === 'concierge' ? result : JSON.parse(result.result.content[0].text);
}
const originalInfo = console.info, originalLog = console.log;
const events = [];
if (!live) { console.info = value => events.push(JSON.parse(value)); console.log = () => {}; }
try {
  for (let index = 0; index < approved.length; index++) {
    const item = approved[index];
    for (const endpoint of ['concierge', 'mcp']) {
      const result = await ask(endpoint, item.question);
      assert.equal(result.answer, item.ownerFinalAnswer, `${item.id}: ${endpoint} wording`);
      assert.equal(result.approvedAnswerId, item.id);
      assert.equal(result.answerVersion, '2026-09-19.1');
      assert.equal(result.answered, true);
      assert.ok(result.commercialBoundary.includes('cannot submit forms'));
      if (['A01','A02','A03','A06','A09','A10','A12'].includes(item.id)) assert.equal(result.nextStep.email, 'sales@a2b.sa');
      if (live) originalLog(JSON.stringify({ id: item.id, endpoint, passed: true }));
    }
    // Respect the direct endpoint's five requests per minute, without bypassing limits.
    if (live && index < approved.length - 1) await new Promise(resolve => setTimeout(resolve, 13000));
  }
  if (!live) {
    const variants = [
      ['A01', 'What is the price for road freight from Riyadh to Dammam?'],
      ['A02', 'Is a refrigerated truck available tomorrow?'],
      ['A03', 'We need storage in Dubai only.'],
      ['A04', 'Is your fleet ISO certified?'],
      ['A05', 'Can I track my cargo?'],
      ['A06', 'What documents are needed for customs clearance?'],
      ['A07', 'Are you hiring truck drivers?'],
      ['A08', 'How can I register as a vendor?'],
      ['A09', 'ما هي خدماتكم اللوجستية؟'],
      ['A10', 'بكم نقل البضائع من جدة للرياض؟'],
      ['A11', 'I need a consumer courier for personal parcels.'],
      ['A12', 'Please submit the quotation to the sales team.']
    ];
    for (const [id, question] of variants) {
      for (const endpoint of ['concierge','mcp']) assert.equal((await ask(endpoint, question)).approvedAnswerId, id, question);
    }
    for (const question of ['Do you have ISO 27001 certification?', 'What is your ISO certificate expiry date?', 'Are you ISO certified and can you send the certificate?', 'Which ISO standard covers this operation?', 'Do you have ISO certification for nuclear cargo?']) {
      const result = await answerAgentQuestion(question);
      assert.equal(result.intent, 'compliance'); assert.equal(result.approvedAnswerId, undefined);
      assert.ok(result.answer.includes('require official documents'));
    }
    const differentLane = await answerAgentQuestion('Quote trucking from Jeddah to Tabuk');
    assert.equal(differentLane.fit, 'needs_confirmation'); assert.ok(!differentLane.answer.includes('Riyadh to Dammam'));
    const crossBorder = await answerAgentQuestion('Do you offer warehousing for Dubai to Saudi Arabia shipments?');
    assert.notEqual(crossBorder.approvedAnswerId, 'A03');
    assert.equal((await answerAgentQuestion('What tracking technology does your fleet use?')).approvedAnswerId, undefined);
    assert.equal((await answerAgentQuestion('What is the stock market forecast?')).answered, false);
    assert.equal(events.filter(event => event.event === 'agent_concierge_question').length, 48);
    assert.ok(events.every(event => event.questionRedacted === undefined), 'Approved answers must not log question text');
  }
} finally { console.info = originalInfo; console.log = originalLog; }
console.log(`${live ? 'Production' : 'Local'} owner-approved answer checks passed: 12 cases through both endpoints${live ? '' : ', 12 paraphrases through both endpoints, nine scope boundaries and answered-log privacy'}.`);
