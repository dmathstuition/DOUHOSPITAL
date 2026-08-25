import 'server-only';
import { headers } from 'next/headers';

/**
 * Minimal in-memory rate limiter for abuse-prone public endpoints.
 *
 * NOTE: state is per server instance, so on serverless (Vercel) this is a
 * best-effort burst guard, not a global limit. For strict limits back this
 * with a shared store (e.g. Upstash Redis) — the call sites don't change.
 */
const buckets = new Map<string, number[]>();

export async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown';
  return `${prefix}:${ip}`;
}

/**
 * Returns true when the action is allowed, false when the caller has exceeded
 * `limit` requests within `windowMs`.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup to bound memory.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
