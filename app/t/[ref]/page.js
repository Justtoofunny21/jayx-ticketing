import QRCode from 'qrcode';
import { notFound } from 'next/navigation';
import { redis } from '@/lib/redis';
import { orderToken, safeEqual } from '@/lib/crypto';
import { EVENT, tierById } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false } };

export default async function TicketPage({ params, searchParams }) {
  const { ref } = await params;
  const { k } = await searchParams;
  if (!/^[a-f0-9]{32}$/.test(ref) || !k || !safeEqual(k, orderToken(ref))) notFound();
  const raw = await redis('GET', `order:${ref}`);
  if (!raw) notFound();
  const o = JSON.parse(raw);
  const qrs = await Promise.all(o.tickets.map((id) => QRCode.toDataURL(id, { margin: 1, width: 440 })));
  return (
    <main>
      <h1>You're in, {o.name.split(' ')[0]} 🎟️</h1>
      <div className="muted">{EVENT.name} · {EVENT.date}<br />{EVENT.venue}</div>
      <p className="muted" style={{ fontSize: 13 }}>Screenshot or bookmark this page. Each ticket works once — don't share the QR publicly.</p>
      {o.tickets.map((id, i) => (
        <div className="card ticket" key={id}>
          <div className="muted">{tierById(o.tierId)?.label} · Ticket {i + 1} of {o.qty}</div>
          <img src={qrs[i]} alt={`QR for ${id}`} />
          <div className="tid">{id}</div>
        </div>
      ))}
    </main>
  );
}
