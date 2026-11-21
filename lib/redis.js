const URL_ = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export async function redis(...cmd) {
  if (!URL_() || !TOKEN()) throw new Error('Redis not configured');
  const r = await fetch(URL_(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
    cache: 'no-store',
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'Redis error');
  return j.result;
}

export async function rateLimit(key, max, windowSec) {
  const n = await redis('INCR', `rl:${key}`);
  if (n === 1) await redis('EXPIRE', `rl:${key}`, windowSec);
  return n <= max;
}
