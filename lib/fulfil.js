import { redis } from './redis';
import { ticketId } from './crypto';
import { verifyTransaction } from './paystack';

// The ONLY place tickets are created. Reached from the webhook and the
// post-payment redirect. Both re-verify with Paystack's API server-to-server;
// nothing the browser sends is ever trusted.
export async function fulfil(ref) {
  if (!/^[a-f0-9]{32}$/.test(ref)) return { ok: false, reason: 'bad_ref' };

  const existing = await redis('GET', `order:${ref}`);
  if (existing) return { ok: true, order: JSON.parse(existing) };

  const pendingRaw = await redis('GET', `pending:${ref}`);
  if (!pendingRaw) return { ok: false, reason: 'unknown' };
  const p = JSON.parse(pendingRaw);

  const tx = await verifyTransaction(ref);
  if (!tx || tx.status !== 'success' || tx.reference !== ref || tx.currency !== 'NGN' || tx.amount !== p.amount) {
    return { ok: false, reason: 'unpaid' };
  }

  const issuedAt = Date.now();
  const tickets = Array.from({ length: p.qty }, (_, i) => ticketId(ref, i));
  for (const id of tickets) {
    await redis('SET', `ticket:${id}`, JSON.stringify({ ref, tierId: p.tierId, name: p.name, email: p.email, issuedAt }));
  }
  const order = { ref, name: p.name, email: p.email, tierId: p.tierId, qty: p.qty, amount: p.amount, tickets, issuedAt };
  const first = await redis('SET', `order:${ref}`, JSON.stringify(order), 'NX');
  if (first === 'OK') {
    await redis('INCRBY', `sold:${p.tierId}`, p.qty);
    return { ok: true, order };
  }
  return { ok: true, order: JSON.parse(await redis('GET', `order:${ref}`)) };
}
