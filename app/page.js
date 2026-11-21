'use client';
import { useState } from 'react';
import { EVENT } from '@/lib/events';

export default function Home() {
  const [tierId, setTier] = useState(EVENT.tiers[0].id);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const tier = EVENT.tiers.find((t) => t.id === tierId);

  async function pay(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tierId, qty, name, email }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Failed');
      window.location.href = j.url;
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <main>
      <h1>{EVENT.name}</h1>
      <div className="muted">{EVENT.date}<br />{EVENT.venue}</div>
      <form className="card" onSubmit={pay}>
        <label>Ticket type</label>
        <select value={tierId} onChange={(e) => setTier(e.target.value)}>
          {EVENT.tiers.map((t) => <option key={t.id} value={t.id}>{t.label} — ₦{t.price.toLocaleString()}</option>)}
        </select>
        <label>Quantity</label>
        <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
          {Array.from({ length: EVENT.maxPerOrder }, (_, i) => i + 1).map((n) => <option key={n}>{n}</option>)}
        </select>
        <label>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={120} />
        <button disabled={busy}>{busy ? 'Redirecting…' : `Pay ₦${(tier.price * qty).toLocaleString()}`}</button>
        {err && <div className="err">{err}</div>}
      </form>
      <p className="muted" style={{ fontSize: 13 }}>Payments by Paystack. Your ticket ID appears right after payment.</p>
    </main>
  );
}
