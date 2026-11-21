import { NextResponse } from 'next/server';
import { EVENT, tierById } from '@/lib/events';
import { redis, rateLimit } from '@/lib/redis';
import { randomRef, siteUrl, clientIp } from '@/lib/crypto';
import { initTransaction } from '@/lib/paystack';

export const dynamic = 'force-dynamic';
const bad = (m, s = 400) => NextResponse.json({ error: m }, { status: s });

export async function POST(req) {
  try {
    if (!(await rateLimit(`co:${clientIp(req)}`, 15, 600))) return bad('Too many attempts. Try later.', 429);

    const b = await req.json().catch(() => null);
    if (!b) return bad('Invalid request');
    const tier = tierById(String(b.tierId));
    const qty = Number(b.qty);
    const name = String(b.name || '').trim().slice(0, 80);
    const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
    if (!tier) return bad('Invalid ticket type');
    if (!Number.isInteger(qty) || qty < 1 || qty > EVENT.maxPerOrder) return bad('Invalid quantity');
    if (name.length < 2) return bad('Enter your name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Enter a valid email');

    const sold = Number(await redis('GET', `sold:${tier.id}`)) || 0;
    if (sold + qty > tier.capacity) return bad('Sold out or not enough tickets left', 409);

    const ref = randomRef();
    const amount = tier.price * qty * 100; // kobo, computed on the server
    await redis('SET', `pending:${ref}`, JSON.stringify({ tierId: tier.id, qty, amount, name, email }), 'EX', 60 * 60 * 24 * 7);

    const data = await initTransaction({
      email, amount, currency: 'NGN', reference: ref,
      callback_url: `${siteUrl()}/verify`,
      metadata: { tierId: tier.id, qty, name },
    });
    return NextResponse.json({ url: data.authorization_url });
  } catch (e) {
    console.error('checkout', e.message);
    return bad('Could not start payment', 500);
  }
}
