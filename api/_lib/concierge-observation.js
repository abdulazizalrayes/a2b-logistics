import { fingerprint, redactSensitive } from './public-api-guard.js';

// Process-local suppression only; retained reports must not assume a global counter.
const duplicateQuestions = new Map();
const DAY_MS = 86_400_000;

export function logConciergeAnswer({ requestId, question, result, source }) {
  const now = Date.now();
  for (const [key, seenAt] of duplicateQuestions) {
    if (now - seenAt > DAY_MS) duplicateQuestions.delete(key);
  }
  const id = fingerprint(question);
  const duplicate = duplicateQuestions.has(id);
  duplicateQuestions.set(id, now);
  const event = {
    event: 'agent_concierge_question', requestId, source, fingerprint: id,
    intent: result.intent, answered: result.answered, fit: result.fit,
    duplicate, requiresReview: !result.answered, ts: new Date(now).toISOString()
  };
  if (!result.answered && !duplicate) event.questionRedacted = redactSensitive(question);
  console.info(JSON.stringify(event));
  return duplicate;
}
