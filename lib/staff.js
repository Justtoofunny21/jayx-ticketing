import { cookies } from 'next/headers';
import { hmac, safeEqual } from './crypto';

const sign = (exp) => hmac(`staff:${exp}`).toString('base64url');
export const makeStaffToken = () => {
  const exp = Date.now() + 12 * 3600 * 1000;
  return `${exp}.${sign(exp)}`;
};
export async function isStaff() {
  const v = (await cookies()).get('staff')?.value;
  if (!v) return false;
  const [exp, sig] = v.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}
