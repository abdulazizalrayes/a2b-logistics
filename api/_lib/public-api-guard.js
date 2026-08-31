import { createHash } from 'node:crypto';

const rateBuckets = new Map();
const abuseBuckets = new Map();

const SECRET_PATTERNS = [
  /\b(?:password|passwd|passcode|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|private[_ -]?key|client[_ -]?secret)\b\s*[:=]\s*\S+/i,
  /\b(?:sk|pk)_(?:live|test)_[a-z0-9_-]{12,}\b/i,
  /\bgh[pousr]_[a-z0-9]{20,}\b/i,
  /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i
];

const PERSONAL_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /(?:\+?\d[\d\s().-]{7,}\d)/
];

const INJECTION_PATTERNS = [
  /ignore (?:all |any )?(?:previous|prior|above) (?:instructions|rules|messages)/i,
  /reveal (?:the )?(?:system|developer) (?:prompt|message|instructions)/i,
  /(?:show|print|return|expose|leak) (?:all )?(?:secrets|credentials|passwords|tokens|environment variables)/i,
  /(?:jailbreak|prompt injection|developer mode|system override)/i,
  /(?:execute|run) (?:this )?(?:shell|terminal|bash|powershell|sql) (?:command|code)/i,
  /(?:read|download|list) (?:private|internal|environment|server) (?:files|data|variables|secrets)/i
];

function prune(map, now, ttlMs) {
  for (const [key, value] of map) {
    const timestamp = value.updatedAt || value.blockedUntil || 0;
    if (now - timestamp > ttlMs) map.delete(key);
  }
}

function clientKey(req, namespace) {
  const forwarded = String(req.headers?.['cf-connecting-ip'] || req.headers?.['x-real-ip'] || req.headers?.['x-forwarded-for'] || 'unknown');
  const ip = forwarded.split(',')[0].trim().slice(0, 96);
  return createHash('sha256').update(`${namespace}:${ip}`).digest('hex');
}

export function isCanonicalProductionHost(req) {
  if (process.env.VERCEL_ENV !== 'production') return true;
  const host = String(req.headers?.host || req.headers?.['x-forwarded-host'] || '').split(':')[0].toLowerCase();
  return host === 'www.a2b.sa' || host === 'a2b.sa';
}

export function isJsonRequest(req) {
  const contentType = String(req.headers?.['content-type'] || '').toLowerCase().split(';')[0].trim();
  return contentType === 'application/json' || /^application\/[a-z0-9.+-]+\+json$/.test(contentType);
}

export function requestBodySize(req) {
  const declared = Number.parseInt(String(req.headers?.['content-length'] || ''), 10);
  if (Number.isFinite(declared) && declared >= 0) return declared;
  try {
    return Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function takeRateLimit(req, { namespace, limit, windowMs }) {
  const now = Date.now();
  prune(rateBuckets, now, Math.max(windowMs * 3, 180_000));
  const key = clientKey(req, namespace);
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    const next = { count: 1, resetAt: now + windowMs, updatedAt: now };
    rateBuckets.set(key, next);
    return { allowed: true, remaining: limit - 1, retryAfter: Math.ceil(windowMs / 1000) };
  }
  bucket.count += 1;
  bucket.updatedAt = now;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), retryAfter };
}

export function registerAbuse(req, { namespace, threshold = 3, windowMs = 600_000, blockMs = 600_000 }) {
  const now = Date.now();
  prune(abuseBuckets, now, Math.max(windowMs, blockMs) * 3);
  const key = clientKey(req, namespace);
  const bucket = abuseBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    abuseBuckets.set(key, { count: 1, startedAt: now, updatedAt: now, blockedUntil: 0 });
    return { blocked: false, retryAfter: 0 };
  }
  bucket.count += 1;
  bucket.updatedAt = now;
  if (bucket.count >= threshold) bucket.blockedUntil = now + blockMs;
  return {
    blocked: bucket.blockedUntil > now,
    retryAfter: bucket.blockedUntil > now ? Math.ceil((bucket.blockedUntil - now) / 1000) : 0
  };
}

export function currentAbuseBlock(req, namespace) {
  const now = Date.now();
  const bucket = abuseBuckets.get(clientKey(req, namespace));
  if (!bucket?.blockedUntil || bucket.blockedUntil <= now) return { blocked: false, retryAfter: 0 };
  return { blocked: true, retryAfter: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000)) };
}

export function containsSensitiveInput(value) {
  const input = String(value || '');
  return SECRET_PATTERNS.some((pattern) => pattern.test(input)) || PERSONAL_PATTERNS.some((pattern) => pattern.test(input));
}

export function isPromptInjection(value) {
  const input = String(value || '');
  return INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function redactSensitive(value, maxLength = 500) {
  let output = String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  for (const pattern of SECRET_PATTERNS) output = output.replace(pattern, '[REDACTED_SECRET]');
  output = output
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]')
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, '[REDACTED_PHONE]');
  return output.slice(0, maxLength);
}

export function fingerprint(value) {
  const normalized = String(value || '').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
  return createHash('sha256').update(normalized).digest('hex');
}

export function applyPublicApiHeaders(res, requestId) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type,x-request-id');
  res.setHeader('Access-Control-Max-Age', '600');
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Signal', 'search=yes, ai-input=yes, ai-train=no');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
