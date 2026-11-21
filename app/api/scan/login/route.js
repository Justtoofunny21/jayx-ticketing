import { NextResponse } from 'next/server';
import { safeEqual, clientIp } from '@/lib/crypto';
import { rateLimit } from '@/lib/redis';
import { makeStaffToken } from '@/lib/staff';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  if (!(await rateLimit(`login:${clientIp(req)}`, 8, 900))) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }
  const { password } = (await req.json().catch(() => ({}))) || {};
  const real = process.env.STAFF_PASSWORD;
  if (!real || real.length < 10 || !password || !safeEqual(password, real)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('staff', makeStaffToken(), {
    httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 12 * 3600,
  });
  return res;
}
