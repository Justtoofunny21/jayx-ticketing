const BASE = 'https://api.paystack.co';
const key = () => {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error('PAYSTACK_SECRET_KEY missing');
  return process.env.PAYSTACK_SECRET_KEY;
};

export async function initTransaction(body) {
  const r = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const j = await r.json();
  if (!r.ok || !j.status) throw new Error('Paystack init failed');
  return j.data;
}

export async function verifyTransaction(ref) {
  const r = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(ref)}`, {
    headers: { Authorization: `Bearer ${key()}` },
    cache: 'no-store',
  });
  const j = await r.json();
  if (!r.ok || !j.status) return null;
  return j.data;
}
