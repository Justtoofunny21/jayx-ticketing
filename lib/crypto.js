import crypto from 'crypto';
import { EVENT } from './events';

function secret() {
  const s = process.env.TICKET_SECRET;
  if (!s || s.length < 32) throw new Error('TICKET_SECRET missing or too short');
  return s;
}
export const hmac = (msg) => crypto.createHmac('sha256', secret()).update(msg).digest();

export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const ALPHA = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
// Deterministic + unguessable: derived from server secret + payment reference.
// Same reference always yields the same IDs, so fulfilment is idempotent.
export function ticketId(ref, i) {
  const d = hmac(`tkt:${ref}:${i}`);
  let s = '';
  for (let k = 0; k < 12; k++) s += ALPHA[d[k] % ALPHA.length];
  return `${EVENT.prefix}-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}
export const orderToken = (ref) => hmac(`ord:${ref}`).toString('base64url');
export const randomRef = () => crypto.randomBytes(16).toString('hex');
export const normalizeCode = (c) => String(c || '').trim().toUpperCase();
export const validCode = (c) => /^[A-Z0-9]{1,6}(-[A-Z0-9]{4}){3}$/.test(c);

export function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  throw new Error('SITE_URL not set');
}
export const clientIp = (req) => (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
