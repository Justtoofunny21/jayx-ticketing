import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/crypto';
import { fulfil } from '@/lib/fulfil';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const raw = await req.text(); // raw body — required for signature check
  const sig = req.headers.get('x-paystack-signature') || '';
  const expected = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(raw).digest('hex');
  if (!process.env.PAYSTACK_SECRET_KEY || !safeEqual(sig, expected)) {
    return new NextResponse('invalid signature', { status: 401 });
  }
  try {
    const evt = JSON.parse(raw);
    if (evt.event === 'charge.success' && evt.data?.reference) await fulfil(evt.data.reference);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('webhook', e.message);
    return new NextResponse('error', { status: 500 }); // Paystack will retry
  }
}
