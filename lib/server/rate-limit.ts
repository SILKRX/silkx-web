/**
 * Простой rate-limit «скользящее окно» в памяти процесса.
 * На serverless это best-effort (у каждого инстанса своя память) — защита от ботов-однодневок.
 * Для прод-нагрузки заменить на Upstash Redis с той же сигнатурой.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > MAX_KEYS) {
    const first = buckets.keys().next().value;
    if (first !== undefined) buckets.delete(first);
  }
  return { ok: true, retryAfterSec: 0 };
}

/** IP клиента за прокси Vercel/Cloudflare/nginx. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}
