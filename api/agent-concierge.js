import { randomUUID } from 'node:crypto';
import { answerAgentQuestion } from './_lib/agent-concierge-engine.js';
import {
  applyPublicApiHeaders,
  containsSensitiveInput,
  currentAbuseBlock,
  fingerprint,
  isCanonicalProductionHost,
  isJsonRequest,
  isPromptInjection,
  redactSensitive,
  registerAbuse,
  requestBodySize,
  takeRateLimit
} from './_lib/public-api-guard.js';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_QUESTION_LENGTH = 2_000;
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;
const duplicateQuestions = new Map();

function json(res, status, payload) {
  res.status(status).json(payload);
}

function logQuestion({ requestId, question, result, duplicate }) {
  const event = {
    event: 'agent_concierge_question',
    requestId,
    fingerprint: fingerprint(question),
    intent: result.intent,
    answered: result.answered,
    fit: result.fit,
    duplicate,
    requiresReview: !result.answered,
    ts: new Date().toISOString()
  };
  if (!result.answered && !duplicate) event.questionRedacted = redactSensitive(question);
  console.info(JSON.stringify(event));
}

function isDuplicate(question) {
  const now = Date.now();
  const id = fingerprint(question);
  for (const [key, seenAt] of duplicateQuestions) {
    if (now - seenAt > 86_400_000) duplicateQuestions.delete(key);
  }
  const duplicate = duplicateQuestions.has(id);
  duplicateQuestions.set(id, now);
  return duplicate;
}

export default async function handler(req, res) {
  const requestId = String(req.headers?.['x-request-id'] || randomUUID()).slice(0, 128);
  applyPublicApiHeaders(res, requestId);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!isCanonicalProductionHost(req)) {
    json(res, 421, { error: 'Use the canonical a2b endpoint at https://www.a2b.sa/api/agent-concierge.', requestId });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    json(res, 405, { error: 'Method not allowed.', requestId });
    return;
  }

  const activeBlock = currentAbuseBlock(req, 'agent-concierge-abuse');
  if (activeBlock.blocked) {
    res.setHeader('Retry-After', String(activeBlock.retryAfter));
    json(res, 429, { error: 'Temporarily blocked after repeated unsafe requests.', requestId });
    return;
  }

  if (!isJsonRequest(req)) {
    registerAbuse(req, { namespace: 'agent-concierge-abuse' });
    json(res, 415, { error: 'Content-Type must be application/json.', requestId });
    return;
  }

  if (requestBodySize(req) > MAX_BODY_BYTES) {
    registerAbuse(req, { namespace: 'agent-concierge-abuse' });
    json(res, 413, { error: 'Request body exceeds the 32 KB limit.', requestId });
    return;
  }

  const rate = takeRateLimit(req, { namespace: 'agent-concierge', limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });
  res.setHeader('RateLimit-Limit', String(RATE_LIMIT));
  res.setHeader('RateLimit-Remaining', String(rate.remaining));
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    json(res, 429, { error: 'Rate limit exceeded.', retryAfterSeconds: rate.retryAfter, requestId });
    return;
  }

  const body = req.body;
  const allowedKeys = new Set(['question', 'language', 'agent']);
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !allowedKeys.has(key))) {
    registerAbuse(req, { namespace: 'agent-concierge-abuse' });
    json(res, 400, { error: 'Invalid request schema.', requestId });
    return;
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    json(res, 400, { error: `question must contain 1 to ${MAX_QUESTION_LENGTH} characters.`, requestId });
    return;
  }

  if (body.language !== undefined && !['en'].includes(body.language)) {
    json(res, 400, { error: 'The pilot currently returns English agent responses only.', requestId });
    return;
  }

  if (body.agent !== undefined && (typeof body.agent !== 'string' || body.agent.length > 120)) {
    json(res, 400, { error: 'agent must be a short non-sensitive identifier.', requestId });
    return;
  }

  if (containsSensitiveInput(question) || containsSensitiveInput(body.agent)) {
    json(res, 400, { error: 'Do not send personal data, passwords, API keys, tokens, or other secrets to this public endpoint.', requestId });
    return;
  }

  if (isPromptInjection(question)) {
    const abuse = registerAbuse(req, { namespace: 'agent-concierge-abuse' });
    if (abuse.blocked) res.setHeader('Retry-After', String(abuse.retryAfter));
    json(res, abuse.blocked ? 429 : 400, { error: 'Unsafe instruction rejected. This endpoint answers only from approved public a2b facts.', requestId });
    return;
  }

  try {
    const result = await answerAgentQuestion(question);
    const duplicate = isDuplicate(question);
    logQuestion({ requestId, question, result, duplicate });
    json(res, 200, {
      ...result,
      duplicate,
      requestId,
      service: 'a2b-agent-concierge',
      version: '1.0.0',
      privacy: 'No personal data, credentials, or secrets are accepted. No question content is logged for answered requests. Unanswered questions are logged only after redaction for owner knowledge review.'
    });
  } catch {
    json(res, 500, { error: 'The public knowledge source could not be read.', requestId });
  }
}
