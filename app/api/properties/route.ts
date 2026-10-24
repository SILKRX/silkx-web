import { NextResponse } from "next/server";

import { listProperties, parseQuery, toPublicJson } from "@/lib/data/properties";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * GET /api/properties — список опубликованных объектов для Telegram-бота и внешних клиентов.
 * Параметры: type=sale|rent, district=<slug>, rooms=0..4 (4 = 4+), maxPrice, currency=USD|UZS, q=<текст>, limit=1..50
 * Пример: /api/properties?type=rent&rooms=0&maxPrice=500
 */
export async function GET(req: Request) {
  const limit = rateLimit(`properties:${clientIp(req)}`, 120, 60_000);
  if (!limit.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } });

  const query = parseQuery(new URL(req.url).searchParams);
  const { items, total } = await listProperties(query);
  return NextResponse.json(
    { ok: true, total, items: items.map((p) => toPublicJson(p, SITE_URL)) },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
