const buckets = globalThis.__smithHeffaRateLimitBuckets || new Map();
globalThis.__smithHeffaRateLimitBuckets = buckets;

export function allowRequest(req, scope, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const identity = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const key = `${scope}:${identity}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
