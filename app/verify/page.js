import { redirect } from 'next/navigation';
import { fulfil } from '@/lib/fulfil';
import { orderToken } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export default async function Verify({ searchParams }) {
  const sp = await searchParams;
  const ref = String(sp.reference || sp.trxref || '');
  let res = { ok: false };
  try { res = await fulfil(ref); } catch (e) { console.error('verify', e.message); }
  if (res.ok) redirect(`/t/${ref}?k=${orderToken(ref)}`);
  return (
    <main>
      <h1>Payment not confirmed</h1>
      <p className="muted">We couldn't confirm this payment yet. If you were charged, refresh in a minute — your ticket is issued automatically once Paystack confirms it.</p>
      <a href="/">Back</a>
    </main>
  );
}
