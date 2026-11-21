import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { normalizeCode, validCode } from '@/lib/crypto';
import { isStaff } from '@/lib/staff';
import { tierById } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await isStaff())) return NextResponse.json({ error: 'Not authorised' }, { status: 401 });
  const { code } = (await req.json().catch(() => ({}))) || {};
  const id = normalizeCode(code);
  if (!validCode(id)) return NextResponse.json({ status: 'invalid' });

  const raw = await redis('GET', `ticket:${id}`);
  if (!raw) return NextResponse.json({ status: 'invalid' });
  const t = JSON.parse(raw);
  const info = { name: t.name, tier: tierById(t.tierId)?.label || t.tierId };

  // Atomic single-use: SET NX succeeds for exactly one scan, even with simultaneous scanners.
  const first = await redis('SET', `used:${id}`, String(Date.now()), 'NX');
  if (first === 'OK') return NextResponse.json({ status: 'valid', ...info });
  const at = Number(await redis('GET', `used:${id}`));
  return NextResponse.json({ status: 'used', usedAt: at, ...info });
}
